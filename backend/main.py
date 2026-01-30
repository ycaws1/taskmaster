import os
import asyncio
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from pywebpush import webpush, WebPushException
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks, HTTPException
from contextlib import asynccontextmanager

# Load environment variables from the parent directory
load_dotenv()

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "mailto:admin@taskmaster-ochre-three.vercel.app")
POLL_INTERVAL = 5  # seconds

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def run_notification_cycle():
    """Synchronous notification processing logic."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Check for due items
        query = """
            SELECT t.id, t.text, c.name as category_name
            FROM "TodoItem" t
            JOIN "Category" c ON t."categoryId" = c.id
            WHERE t."notificationAt" <= NOW() 
              AND t."notificationSent" = false
        """
        cur.execute(query)
        due_items = cur.fetchall()

        if not due_items:
            return

        logger.info(f"Worker found {len(due_items)} due items.")

        # 2. Get all subscriptions
        cur.execute('SELECT * FROM "PushSubscription"')
        subscriptions = cur.fetchall()

        if not subscriptions:
            logger.warning("No subscriptions found in DB.")
            return

        # 3. Process items
        subs_to_delete = set()
        
        for item in due_items:
            payload = json.dumps({
                "title": f"Task Due: {item['text']}",
                "body": f"Your task in \"{item['category_name']}\" is due now!",
                "icon": "/android-chrome-192x192.png",
                "url": "/"
            })

            for sub in subscriptions:
                if sub['id'] in subs_to_delete:
                    continue
                    
                subscription_info = {
                    "endpoint": sub['endpoint'],
                    "keys": {
                        "p256dh": sub['p256dh'],
                        "auth": sub['auth']
                    }
                }

                try:
                    webpush(
                        subscription_info=subscription_info,
                        data=payload,
                        vapid_private_key=VAPID_PRIVATE_KEY,
                        vapid_claims={"sub": VAPID_SUBJECT}
                    )
                except WebPushException as ex:
                    if ex.response is not None and ex.response.status_code in [404, 410]:
                        subs_to_delete.add(sub['id'])
                except Exception as e:
                    logger.error(f"Error sending push: {e}")

            # Mark item as sent
            cur.execute(
                'UPDATE "TodoItem" SET "notificationSent" = true WHERE id = %s',
                (item['id'],)
            )
            conn.commit()

        # 4. Clean up dead subscriptions
        if subs_to_delete:
            logger.info(f"Cleaning up {len(subs_to_delete)} expired subscriptions")
            if len(subs_to_delete) == 1:
                cur.execute('DELETE FROM "PushSubscription" WHERE id = %s', (list(subs_to_delete)[0],))
            else:
                cur.execute('DELETE FROM "PushSubscription" WHERE id IN %s', (tuple(subs_to_delete),))
            conn.commit()

    except Exception as e:
        logger.error(f"Background worker error: {e}")
    finally:
        if conn:
            conn.close()

async def notification_worker():
    """Infinite loop for the background worker."""
    logger.info("Notification background worker started.")
    while True:
        try:
            # Run the synchronous logic in a separate thread to keep the event loop free
            await asyncio.to_thread(run_notification_cycle)
        except Exception as e:
            logger.error(f"Worker loop crash: {e}")
        await asyncio.sleep(POLL_INTERVAL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background worker
    worker_task = asyncio.create_task(notification_worker())
    yield
    # Shutdown: Cancel the worker
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        logger.info("Worker task cancelled.")

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# ... (rest of imports)

# ... (rest of config)

app = FastAPI(lifespan=lifespan, title="Taskmaster Notification Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NotificationTest(BaseModel):
    subscription: dict
    title: Optional[str] = "Test Notification"
    body: Optional[str] = "If you see this, notifications are working!"

@app.get("/")
async def root():
    return {"status": "ok", "message": "Notification server is running"}

@app.get("/subscriptions")
async def get_subscriptions():
    """Check all subscriptions."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT id, endpoint, "createdAt" FROM "PushSubscription"')
        subs = cur.fetchall()
        return {"count": len(subs), "subscriptions": subs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@app.post("/subscriptions/clear")
async def clear_subscriptions():
    """Clear all subscriptions."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM "PushSubscription"')
        deleted = cur.rowcount
        conn.commit()
        logger.info(f"Manually cleared {deleted} subscriptions.")
        return {"status": "success", "message": f"Cleared {deleted} subscriptions"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@app.post("/test")
async def test_notification(data: NotificationTest):
    """Send a test notification to a specific subscription."""
    try:
        payload = json.dumps({
            "title": data.title,
            "body": data.body,
            "icon": "/android-chrome-192x192.png",
            "url": "/"
        })

        subscription_info = {
            "endpoint": data.subscription['endpoint'],
            "keys": {
                "p256dh": data.subscription['keys']['p256dh'],
                "auth": data.subscription['keys']['auth']
            }
        }

        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_SUBJECT}
        )
        return {"status": "success", "message": "Notification sent"}
    except Exception as e:
        logger.error(f"Test push error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trigger")
async def trigger_notifications(background_tasks: BackgroundTasks):
    """Manually trigger a notification cycle."""
    background_tasks.add_task(run_notification_cycle)
    return {"status": "queued", "message": "Notification cycle triggered"}


if __name__ == "__main__":
    import uvicorn
    if not VAPID_PRIVATE_KEY:
        logger.error("VAPID_PRIVATE_KEY not set in .env")
        exit(1)
    
    # Run uvicorn server
    uvicorn.run(app, host="0.0.0.0", port=8000)
