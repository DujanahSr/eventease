# ===================================================================
# Stage 1: Build React + Vite Production Bundle
# ===================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for build layer caching
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy application source and build
COPY . .
RUN npm run build

# ===================================================================
# Stage 2: Production Nginx Server
# ===================================================================
FROM nginx:alpine

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built SPA assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA routing & reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
