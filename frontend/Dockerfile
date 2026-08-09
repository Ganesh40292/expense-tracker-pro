# ═══════════════════════════════════════════════════════════
#  ExpenseTracker Frontend — Production Dockerfile
#  Multi-stage: Node build → Nginx serve
# ═══════════════════════════════════════════════════════════

# ── Stage 1: Build React/Vite ─────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .

# Build arg allows Docker Compose to inject the API URL
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx config and static files
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Install curl for healthcheck
RUN apk add --no-cache curl

# Expose port 80
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
