# Multi-stage build for production-ready Vite + React app

# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_SOCKET_URL

# Create .env.production file from build arg
RUN echo "VITE_SOCKET_URL=${VITE_SOCKET_URL}" > .env.production

# Debug: Show what we're building with
RUN echo "Building with:" && cat .env.production

# Build the application (Vite will read .env.production)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
