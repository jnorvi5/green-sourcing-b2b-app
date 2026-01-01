#
# Root Dockerfile: single-container "full-stack" build for Azure Container Apps
#
# - Builds `frontend/` (Vite) -> served as static files by `backend/` (Express)
# - Runs `backend/` on PORT (default 3001)
#

# -----------------
# STAGE 1: Frontend build
# -----------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN npm --prefix ./frontend ci

COPY frontend ./frontend
RUN npm --prefix ./frontend run build

# -----------------
# STAGE 2: Backend deps
# -----------------
FROM node:20-alpine AS backend-deps
WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm --prefix ./backend ci --omit=dev

# -----------------
# STAGE 3: Runtime
# -----------------
FROM node:20-alpine AS runner
WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend ./
COPY database-schemas ./database-schemas
COPY --from=frontend-builder /app/frontend/dist ./frontend-dist

EXPOSE 3001

CMD ["node", "index.js"]
