# ==========================================
# Cash Management System - Production Dockerfile
# ==========================================

FROM node:20-alpine

# Install curl for Docker health check
RUN apk add --no-cache curl

# Set working directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies (if any are added in future)
RUN npm ci --only=production || npm install --production

# Copy application source code
COPY public ./public
COPY services ./services
COPY start-services.js ./

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000

# Expose microservices ports (Gateway: 5000, Auth: 5001, Account: 5002, Transaction: 5003, Analytics: 5004, Reconciliation: 5005)
EXPOSE 5000 5001 5002 5003 5004 5005

# Use non-root node user for enhanced security
USER node

# Health check targeting API Gateway health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start all microservices orchestrator
CMD ["node", "start-services.js"]
