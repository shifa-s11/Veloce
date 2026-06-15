# Veloce — Premium Task Management Application

Veloce is a production-grade, full-stack task management application designed for speed, security, and exceptional user experience. Built with a Fastify backend and a Next.js 14 App Router frontend, it features real-time synchronization, secure file uploads with Supabase Storage, a complete activity logging timeline, and role-based admin controls.

**Total Hosting Cost:** $0 (utilizing free-tier options for DB, Storage, and Compute).

---

## 🛠️ Tech Stack & Architecture

- **Monorepo:** Managed via NPM workspaces.
- **Frontend:** Next.js 14 (App Router), styled with Tailwind CSS & custom design variables (Linear-inspired design), global state managed via Zustand, data fetching and caching with SWR.
- **Backend:** Node.js (20+), Fastify (2-3x faster than Express, schema-validated, TypeScript first).
- **Database:** Supabase (PostgreSQL 15) managed via Prisma ORM.
- **Real-Time:** Server-Sent Events (SSE) authenticated securely for low-overhead, keep-alive active task updates.
- **Storage:** Supabase Storage (public bucket) with local file-system fallback (secured with authentication).
- **Authentication (BFF Architecture):** Cross-domain safe authentication utilizing a Backend-for-Frontend (BFF) approach. Next.js API Routes proxy authentication to Fastify, securely setting `HttpOnly` refresh token cookies on the Next.js frontend domain while keeping access tokens exclusively in memory (zero `localStorage` usage, preventing XSS).

---

## ⚙️ Project Scaffolding

```
task-manager/
├── backend/            # Fastify REST & SSE API
├── frontend/           # Next.js client & BFF API routes
├── packages/shared/    # Shared validation schemas (Zod) & types
├── docker-compose.yml  # Local Docker boot
├── vercel.json         # Vercel deployment configurations
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

## 🌐 Production Deployment Guide

Veloce is built to be deployed across Vercel (Frontend) and Render (Backend).

### 1. Database & Storage Setup (Supabase - Free)
1. Sign up on [Supabase](https://supabase.com).
2. Create a new PostgreSQL database project.
3. Copy the Connection URI to `DATABASE_URL` for your backend config.
4. Go to **Storage**, create a **public** bucket named **exactly**: `task-attachments`.
5. Note your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Backend Deployment on Render
1. Sign up on [Render](https://render.com) and click **New > Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Name**: `task-manager-api`
   - **Language**: `Docker`
   - **Context**: `.` (Crucial: set to root directory because the backend uses code from `packages/shared`).
   - **Dockerfile Path**: `backend/Dockerfile`
4. Add the following **Environment Variables** in Render's dashboard:
   - `PORT`: `8080`
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `[Your-Postgres-Connection-String]`
   - `JWT_SECRET`: `[Minimum-32-Characters-Random-String]`
   - `ADMIN_SECRET`: `[Your-Secure-Admin-Password]`
   - `ALLOWED_ORIGINS`: `https://[your-vercel-domain].vercel.app` (You can update this after deploying the frontend).
   - `SUPABASE_URL`: `[Your-Supabase-URL]`
   - `SUPABASE_SERVICE_ROLE_KEY`: `[Your-Supabase-Service-Role-Key]`
5. Deploy the service. Take note of the Render URL (e.g. `https://task-manager-api.onrender.com`).

### 3. Frontend Deployment on Vercel
1. Sign up on [Vercel](https://vercel.com).
2. Import your repository.
3. Configure the project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend` (Ensure this is locked in Vercel settings so Vercel doesn't get confused by the monorepo structure).
4. Expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL`: `https://[your-render-backend-url].onrender.com/api/v1`
5. Click **Deploy**. 

---

## 📑 API Endpoints Specification

### Authentication (Public)
- `POST /api/v1/auth/signup` — Register User
- `POST /api/v1/auth/login` — Login 
- `POST /api/v1/auth/refresh` — Sliding JWT rotation 
- `POST /api/v1/auth/logout` — Revokes session 

*(Note: In production, the Vercel Frontend proxies these via `frontend/app/api/auth/*` BFF routes to bypass cross-domain cookie restrictions and prevent XSS).*

### Tasks (Protected)
- `POST /api/v1/tasks` — Create task
- `GET /api/v1/tasks` — Search, filter, page, and sort tasks
- `GET /api/v1/tasks/:id` — Get single task with details, attachments, and logs
- `PATCH /api/v1/tasks/:id` — Update task fields
- `DELETE /api/v1/tasks/:id` — Remove task 

### Attachments & Event Streams (Protected)
- `POST /api/v1/tasks/:id/attachments` — Upload file attachment (max 10MB, falls back to local storage if Supabase is misconfigured)
- `DELETE /api/v1/tasks/:id/attachments/:attachmentId` — Delete attachment
- `GET /api/v1/events` — Server-Sent Events stream for real-time UI synchronization (Authorized via access token query parameter)

### Admin Controls (Admin-Only)
- `POST /api/v1/admin/promote` — Promote user using `X-Admin-Secret` header
- `GET /api/v1/admin/users` — List registered users
- `GET /api/v1/admin/tasks` — Review tasks across all accounts
