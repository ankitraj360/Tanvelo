# Stage 1: Build dependencies and compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace descriptors and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/db/prisma packages/db/prisma
COPY packages/core/package.json packages/core/
COPY packages/sdk/package.json packages/sdk/
COPY apps/gateway/package.json apps/gateway/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/ ./packages/
COPY apps/gateway/ ./apps/gateway/

# Generate Prisma client and compile TypeScript
RUN pnpm --filter @tanvelo/db generate
RUN pnpm --filter @tanvelo/core build
RUN pnpm --filter @tanvelo/gateway build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV GATEWAY_PORT=4000
ENV GATEWAY_HOST=0.0.0.0
ENV MANAGEMENT_PORT=4001
ENV MANAGEMENT_BIND_HOST=127.0.0.1

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configs and build outputs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/db/prisma packages/db/prisma
COPY packages/core/package.json packages/core/
COPY packages/core/dist packages/core/dist
COPY packages/sdk/package.json packages/sdk/
COPY apps/gateway/package.json apps/gateway/
COPY apps/gateway/dist apps/gateway/dist

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile
RUN pnpm --filter @tanvelo/db generate

# Run as non-root user
USER node

EXPOSE 4000 4001

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health/live || exit 1

CMD ["node", "apps/gateway/dist/server.js"]
