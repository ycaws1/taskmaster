'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff } from 'lucide-react';
import { subscribeUser } from '@/app/lib/actions';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function NotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const router = useRouter();

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            registerServiceWorker();
        }
    }, []);

    // Poll for notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            if (permission === 'granted') {
                try {
                    const res = await fetch('/api/notifications/check');
                    const data = await res.json();
                    if (data.success && data.sentCount > 0) {
                        console.log('Notifications sent, refreshing UI');
                        router.refresh();
                    }
                } catch (error) {
                    console.error('Notification check failed', error);
                }
            }
        }, 30000); // Check every 30s

        return () => clearInterval(interval);
    }, [permission, router]);

    // ... (rest of the component)

    async function registerServiceWorker() {
        try {
            // In development, Next-PWA is disabled to prevent loops, so we register our SW manually
            // We use the main sw.js which imports push-sw.js
            // This ensures we share the same registration for PWA features and Push
            if (process.env.NODE_ENV === 'development') {
                // In dev, sometimes next-pwa doesn't register auto, so we do it
                // But we use sw.js, NOT push-sw.js
                const reg = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered in dev with scope:', reg.scope);
            }

            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                setSubscription(sub);
                // Optionally re-sync with server here
                await subscribeToPush(sub);
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    }

    async function subscribeToPush(existingSub?: PushSubscription) {
        try {
            const registration = await navigator.serviceWorker.ready;
            let sub = existingSub;

            if (!sub) {
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidPublicKey) {
                    console.error('No VAPID public key found');
                    return;
                }

                sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });
            }

            setSubscription(sub);
            setPermission('granted');

            // Send to server
            // Need to JSONify safely
            const subJson = sub.toJSON();
            await subscribeUser(subJson);

            console.log('Subscribed successfully!');
        } catch (error) {
            console.error('Failed to subscribe:', error);
            if (Notification.permission === 'denied') {
                setPermission('denied');
            }
        }
    }

    if (!isSupported) return null;

    if (permission === 'granted' && subscription) {
        return (
            <div className="fixed bottom-4 left-4 z-50">
                <button
                    onClick={async () => {
                        try {
                            const res = await fetch('/api/notifications/test', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ subscription }),
                            });
                            if (!res.ok) throw new Error('Failed to send');
                            // Visual feedback could be added here
                        } catch (e) {
                            console.error('Test failed', e);
                            alert('Failed to send test notification. Check console.');
                        }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-md hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
                    title="Test Notification"
                >
                    <Bell className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Bell className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Enable Notifications
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px]">
                        Get alerted when your tasks are due.
                    </p>
                </div>
                <button
                    onClick={async () => {
                        const perm = await Notification.requestPermission();
                        setPermission(perm);
                        if (perm === 'granted') {
                            await subscribeToPush();
                        }
                    }}
                    className="ml-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                    Allow
                </button>

                <button
                    onClick={() => setIsSupported(false)} // Dismiss for session
                    className="ml-2 rounded-lg p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                    <div className="sr-only">Dismiss</div>
                    <BellOff className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
