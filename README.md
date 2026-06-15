# Veloce — Premium Task Management Application

Veloce is a production-grade, full-stack task management application designed for speed, security, and exceptional user experience. Built with a Fastify backend and a Next.js 14 App Router frontend, it features real-time synchronization, secure file uploads with local fallbacks, a complete activity logging timeline, and role-based admin controls.

**Total Hosting Cost:** $0 (utilizing free-tier options for DB, Storage, and Compute).

---

## 🛠️ Tech Stack & Architecture

- **Monorepo:** Managed via NPM workspaces.
- **Frontend:** Next.js 14 (App Router), styled with Tailwind CSS & custom design variables (Linear-inspired design), global state managed via Zustand, data fetching and caching with SWR.
- **Backend:** Node.js (20+), Fastify (2-3x faster than Express, schema-validated, TypeScript first).
- **Database:** Supabase (PostgreSQL 15) managed via Prisma ORM.
- **Real-Time:** Server-Sent Events (SSE) for low-overhead, keep-alive active task updates.
- **Storage:** Supabase Storage (public bucket) with local file-system fallback (secured with authentication).
- **Authentication:** JWT with rotation of sliding Refresh Tokens stored in HTTP-Only, SameSite=Strict cookies.

---

## ⚙️ Project Scaffolding

```
task-manager/
├── backend/            # Fastify REST & SSE API
├── frontend/           # Next.js client
├── packages/shared/    # Shared validation schemas (Zod) & types
├── docker-compose.yml  # Local Docker boot
└── README.md
```

---

## 🚀 Local Quickstart (Development)

### Prerequisites
- Node.js v20+
- Git
- PostgreSQL or a Supabase account (free tier)

### Step 1: Clone and Install
```bash
git clone <repo-url> task-manager
cd task-manager
npm install
```

### Step 2: Environment Setup
1. Create a `.env` file in the `backend/` directory by copying `.env.example`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   *Edit `backend/.env` with your PostgreSQL database URL (or use defaults for Docker).*

2. Create a `.env` file in the `frontend/` directory:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

### Step 3: Run Prisma Migrations
If using a custom PostgreSQL database (e.g., Supabase):
```bash
npm run prisma:migrate -w @task-manager/backend
```

### Step 4: Run Development Services
```bash
# Builds shared dependencies and starts both client and server concurrently
npm run dev
```
- Frontend starts at: `http://localhost:3000`
- Backend starts at: `http://localhost:8080`

---

## 🐳 Running with Docker (One-Command Setup)

To spin up Veloce locally using a containerized PostgreSQL, backend, and frontend:

```bash
docker compose up --build
```
This command:
1. Provisions a PostgreSQL container.
2. Waits for PostgreSQL to be healthy using healthcheck probes.
3. Automatically runs Prisma migrations against the DB.
4. Starts the API server (`:8080`) and the Next.js app (`:3000`).

---

## 🧪 Testing Guidelines

Veloce includes extensive integration tests covering authentication boundaries, route protection, validation, and task isolation.

```bash
# Run backend tests (requires testdb or local Postgres env)
npm run test -w @task-manager/backend
```

---

## 🌐 Production Deployment Guide

### Database & Storage (Supabase - Free)
1. Register on [supabase.com](https://supabase.com) and create a PostgreSQL project.
2. Copy the Connection URI to `DATABASE_URL` in the backend config.
3. Go to **Storage**, create a public bucket named `task-attachments`.

### Backend (Render - Free)
1. Sign up on [render.com](https://render.com).
2. Create a new **Web Service** and link your repository.
3. Set the Root Directory to `backend`.
4. Build Command: `npm ci && npx prisma migrate deploy && npm run build`
5. Start Command: `node dist/server.js`
6. Add environment variables copied from `backend/.env.example`.

### Frontend (Vercel - Free)
1. Sign up on [vercel.com](https://vercel.com).
2. Import your repository.
3. Set the Root Directory to `frontend`.
4. Set Environment Variable: `NEXT_PUBLIC_API_URL=<your-render-backend-url>/api/v1`
5. Click **Deploy**.

---

## 📑 API Endpoints Specification

### Authentication (Public)
- `POST /api/v1/auth/signup` — Register User (`email`, `password`, `fullName`)
- `POST /api/v1/auth/login` — Login (`email`, `password`)
- `POST /api/v1/auth/refresh` — Sliding JWT rotation (uses HTTP-only refresh cookie)
- `POST /api/v1/auth/logout` — Revokes session and clears cookies

### Tasks (Protected)
- `POST /api/v1/tasks` — Create task (`title`, `description`, `status`, `priority`, `dueDate`)
- `GET /api/v1/tasks` — Search, filter, page, and sort tasks
  - Parameters: `?search=key&status=TODO&priority=HIGH&sortBy=dueDate&order=asc&page=1&limit=6`
- `GET /api/v1/tasks/:id` — Get single task with details, attachments, and logs
- `PATCH /api/v1/tasks/:id` — Update task fields
- `DELETE /api/v1/tasks/:id` — Remove task from workspace

### Attachments & Event Streams (Protected)
- `POST /api/v1/tasks/:id/attachments` — Upload file attachment (max 10MB, images & PDFs)
- `DELETE /api/v1/tasks/:id/attachments/:attachmentId` — Delete attachment
- `GET /api/v1/events` — Server-Sent Events stream for real-time task updates

### Admin Controls (Admin-Only)
- `POST /api/v1/admin/promote` — Promote user using `X-Admin-Secret` header
- `GET /api/v1/admin/users` — List registered users
- `GET /api/v1/admin/tasks` — Review tasks across all accounts

---

## 📝 Assumptions & Trade-offs

1. **Render Free Tier Spin-Down:**
   - Render's free services sleep after 15 minutes of inactivity. The first request after a sleep period can take ~30 seconds. This is standard for free hobby plans.
2. **Local Fallback Storage:**
   - If Supabase url or secret variables are missing, the server automatically saves uploads to the local filesystem (`uploads/` root folder). Served files are secured by an authentication check middleware so users can't retrieve attachments belonging to other owners.
3. **Optimistic UI Rollbacks:**
   - The UI mutates the SWR cache immediately on checking off lists or deleting cards. If the API returns an error, SWR catches the exception, rolls back state, and alerts the user using a toast notification.
