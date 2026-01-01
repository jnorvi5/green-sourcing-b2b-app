# ============================================
# Optimized Dockerfile for GreenChainz Backend
# Azure Container Apps Deployment
# ============================================

FROM node:20-alpine AS base

# Install security updates and Azure-compatible packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    ca-certificates \
    dumb-init \
    curl

# ============================================
# STAGE 1: Dependencies Installation
# ============================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including Azure SDKs)
RUN npm ci --only=production && \
    npm cache clean --force

# ============================================
# STAGE 2: Production Runtime
# ============================================
FROM base AS runner
WORKDIR /app

# Production environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV PORT=3001

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check for Azure Container Apps
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose port (Azure Container Apps will map this)
EXPOSE 3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "index.js"]
