
# FILE: frontend/Dockerfile
# PURPOSE: Builds the React + Vite Frontend (Corrected Node Version)

# -----------------
# STAGE 1: The Builder
# -----------------
# --- FIX: Upgraded from node:18 to node:20 as required by Vite ---
FROM node:20-alpine AS builder 

WORKDIR /app

# Copy package files from the frontend folder
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend source code
COPY frontend/. .

# Build the production app
RUN npm run build

# -----------------
# STAGE 2: The Production Runner
# -----------------
# Serve static assets via nginx, and (for docker-compose) proxy /api -> backend
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]