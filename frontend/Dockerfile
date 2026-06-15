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

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/package.json

EXPOSE 3000

WORKDIR /app/frontend
CMD ["npm", "start"]
