# TaskMaster - Collaborative Todo App

A modern, collaborative todo application built with Next.js 16, PostgreSQL, and NextAuth. Multiple users can log in with shared credentials and manage tasks together in real-time.

## ✨ Features

- **📱 PWA Support** - Installable on mobile devices and desktops
- **🔐 Secure Authentication** - Credential-based login with NextAuth
- **📂 Categories** - Organize tasks into categories
- **✅ Todo Management** - Create, edit, complete, and delete tasks
- **🌙 Dark Mode** - Automatic dark/light mode based on system preference
- **👥 Collaborative** - Multiple users can share the same workspace

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth v5 (beta)
- **PWA**: @ducanh2912/next-pwa

---

## 🚀 Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd todoapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/todoapp?schema=public"
   
   APP_USERNAME="admin"
   APP_PASSWORD="your-secure-password"
   
   AUTH_SECRET="generate-a-32-char-random-string"
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Cloud Deployment

### Option 1: Vercel + Neon/Supabase (Recommended)

This is the easiest deployment option as Vercel is optimized for Next.js.

#### Step 1: Set up a PostgreSQL Database

Choose one of these free PostgreSQL providers:

**Neon (Recommended)**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`)

**Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string (URI)

**Railway**
1. Go to [railway.app](https://railway.app)
2. Create a new project → Add PostgreSQL
3. Copy the DATABASE_URL from the Variables tab

#### Step 2: Deploy to Vercel

1. Push your code to GitHub
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Configure Environment Variables in Vercel:
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your PostgreSQL connection string |
   | `APP_USERNAME` | Your login username |
   | `APP_PASSWORD` | Your login password |
   | `AUTH_SECRET` | A random 32-character string (generate with `openssl rand -base64 32`) |

4. Click **Deploy**

5. After deployment, run the database migration:
   ```bash
   npx prisma db push
   ```
   Or use Vercel's build command override:
   ```
   prisma generate && prisma db push && next build
   ```

---

### Option 2: Railway (All-in-One)

Railway can host both the app and database together.

1. Go to [railway.app](https://railway.app)

2. Create a new project

3. Add a **PostgreSQL** database
   - Click "New" → "Database" → "PostgreSQL"

4. Add your **Next.js app**
   - Click "New" → "GitHub Repo" → Select your repository

5. Configure environment variables for the app:
   - `DATABASE_URL` → Click "Add Reference" and select the PostgreSQL `DATABASE_URL`
   - `APP_USERNAME` → Your login username
   - `APP_PASSWORD` → Your login password
   - `AUTH_SECRET` → Generate with `openssl rand -base64 32`

6. Set the build command:
   ```
   npm install && npx prisma generate && npx prisma db push && npm run build
   ```

7. Deploy!

---

### Option 3: Docker + Any Cloud Provider

#### Dockerfile
Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### Update next.config.ts for standalone output:
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
};
```

#### Build and deploy:
```bash
docker build -t todoapp .
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e APP_USERNAME="admin" \
  -e APP_PASSWORD="password" \
  -e AUTH_SECRET="your-secret" \
  todoapp
```

Deploy to any container platform: AWS ECS, Google Cloud Run, Azure Container Apps, DigitalOcean App Platform, etc.

---

## 🔧 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `APP_USERNAME` | Login username for the app | ✅ |
| `APP_PASSWORD` | Login password for the app | ✅ |
| `AUTH_SECRET` | Secret key for NextAuth session encryption | ✅ |

### Generating AUTH_SECRET

```bash
openssl rand -base64 32
```

---

## 📝 Database Schema

```prisma
model Category {
  id        String     @id @default(cuid())
  name      String
  items     TodoItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model TodoItem {
  id         String   @id @default(cuid())
  text       String
  completed  Boolean  @default(false)
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

## 🔒 Security Notes

1. **Change default credentials** - Never use `admin/password123` in production
2. **Use strong AUTH_SECRET** - Generate a random 32+ character string
3. **Use SSL for database** - Ensure your database connection uses `?sslmode=require`
4. **HTTPS only** - Only deploy behind HTTPS in production

---

## 📱 PWA Installation

Once deployed to a production URL with HTTPS:

1. Visit your app in a browser
2. Click "Install" in the browser's address bar (or use browser menu)
3. The app will be installed as a standalone application

---

## 🤝 Multiple Users

This app uses shared credentials. All users who log in with the same username/password share the same workspace and can see each other's changes (after page refresh).

For real-time collaboration, consider adding:
- WebSocket integration (e.g., Pusher, Socket.io)
- Polling with SWR/React Query

---

## 📄 License

MIT
