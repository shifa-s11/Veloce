# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY frontend/package.json ./frontend/

RUN npm ci

COPY packages/shared/ ./packages/shared/
COPY frontend/ ./frontend/

RUN npm run build -w @task-manager/shared

WORKDIR /app/frontend
ENV NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 3000

CMD ["node", "frontend/server.js"]
