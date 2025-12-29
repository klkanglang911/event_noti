# Build stage for shared package
FROM node:20-alpine AS shared-builder

RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy package files for dependency installation
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy shared source and build
COPY packages/shared ./packages/shared
RUN pnpm --filter shared build

# Build stage for web
FROM node:20-alpine AS web-builder

RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy built shared package
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY packages/shared/src ./packages/shared/src

# Copy web source and build
COPY packages/web ./packages/web
RUN pnpm --filter web build

# Build stage for server
FROM node:20-alpine AS server-builder

RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install dependencies (including native modules)
RUN pnpm install --frozen-lockfile

# Copy built shared package
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY packages/shared/src ./packages/shared/src

# Copy server source and build
COPY packages/server ./packages/server
RUN pnpm --filter server build

# Production stage
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Copy built packages
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=server-builder /app/packages/server/dist ./packages/server/dist
COPY --from=web-builder /app/packages/web/dist ./packages/web/dist

# Create data directory
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/event_noti.db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the server
CMD ["node", "packages/server/dist/index.js"]
