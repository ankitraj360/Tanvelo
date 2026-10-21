# Stage 1: Build dependencies and compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace descriptors and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/db/prisma packages/db/prisma
COPY packages/core/package.json packages/core/
COPY packages/sdk/package.json packages/sdk/
COPY apps/gateway/package.json apps/gateway/
COPY apps/web/package.json apps/web/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/ ./packages/
COPY apps/gateway/ ./apps/gateway/

# Generate Prisma client and compile TypeScript
RUN pnpm --filter @tanvelo/db generate
RUN pnpm --filter @tanvelo/db build
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

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace configs and pre-built artifacts from builder stage
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/gateway ./apps/gateway

# Run as non-root user
USER node

EXPOSE 4000 4001

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health/live || exit 1

CMD ["node", "apps/gateway/dist/server.js"]
