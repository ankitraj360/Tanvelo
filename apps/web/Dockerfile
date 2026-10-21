# Stage 1: Build Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace descriptors
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json packages/db/
COPY packages/db/prisma packages/db/prisma
COPY packages/core/package.json packages/core/
COPY packages/sdk/package.json packages/sdk/
COPY apps/gateway/package.json apps/gateway/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Generate Prisma client and compile core
RUN pnpm --filter @tanvelo/db generate
RUN pnpm --filter @tanvelo/db build
RUN pnpm --filter @tanvelo/core build

# Next.js build with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV OUTPUT_STANDALONE=true
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_Y2xlcmsudGFudmVsby5pbiQ"
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY="sk_live_placeholder"
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY

RUN pnpm --filter @tanvelo/web build

# Stage 2: Production standalone runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output and static assets
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
