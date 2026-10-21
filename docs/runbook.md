# Tanvelo Operational Runbook & Disaster Recovery

This document outlines standard operating procedures, backup schedules, recovery drills, and rollback mechanisms for Tanvelo LLM Federation Gateway in production.

---

## 1. Storage Architecture & Persistence Semantics

### Primary Storage: Neon PostgreSQL
- **Role**: Authoritative data store for projects, environments, hashed API keys, encrypted provider credentials (AES-256-GCM), routing rules, rate limit policies, budgets, usage records, and sanitized audit logs.
- **Backups & PITR**:
  - Neon automatically maintains continuous WAL-based Point-in-Time Recovery (PITR) with retention up to 30 days.
  - In the event of catastrophic data corruption or accidental project deletion, restore by creating a new Neon branch from a specific timestamp via the Neon Console or CLI:
    ```bash
    neon branches create --project-id <project_id> --name restore-<timestamp> --as-of <ISO_8601_TIMESTAMP>
    ```
  - Point `DATABASE_URL` and `DIRECT_URL` to the restored branch endpoint.

### Cache & Rate Limiting: Redis 7
- **Role**: Atomic fixed-window request and token-per-minute counters.
- **Failover / Degradation Behavior**:
  - Tanvelo features an automatic graceful in-memory degradation layer.
  - If Redis becomes unreachable, the gateway logs a degraded state and automatically falls back to local in-memory sliding-window buckets.
  - **Data Loss Consequence**: Losing Redis resets current-window rate limit counters to 0. **No billing data, API keys, or project configurations are lost**, because all durable ledger entries are stored atomically in Neon.

---

## 2. Retention Policies & Automated Pruning

To maintain optimal query performance and prevent unconstrained table growth on serverless PostgreSQL, historical records are pruned on a scheduled retention window:

| Entity | Default Retention | Pruning Rationale |
|---|---|---|
| `GatewayRequest` | 90 days | Request telemetry, latency records, token counts |
| `WebhookDelivery` | 30 days | Upstream delivery logs, payloads, and response status |
| `ConfigurationChange` | 180 days | Audit log of project mutations and key rotations |

### Running Retention Pruning
Run the database cleanup script on a recurring schedule (e.g. cron or GitHub Actions schedule):
```bash
# Execute standard pruning job
pnpm db:prune
```

Custom retention periods can be passed programmatically via `@tanvelo/db/cleanup`:
```ts
import { pruneHistoricalRecords } from '@tanvelo/db/cleanup';

await pruneHistoricalRecords({
  requestRetentionDays: 60,
  webhookRetentionDays: 14,
  configChangeRetentionDays: 90,
});
```

---

## 3. Rollback Procedures

### Frontend (Vercel)
If a faulty deployment occurs on `www.tanvelo.in`:
1. Navigate to the Vercel Dashboard -> Project `tanvelo` -> Deployments.
2. Locate the previous healthy deployment and click **Promote to Production** (instant zero-downtime DNS rollback).
3. Or via Vercel CLI:
   ```bash
   vercel rollback <deployment-id-or-url> --token $VERCEL_TOKEN
   ```

### Backend Gateway (Render)
If a backend deployment fails or exhibits unexpected latency:
1. Access the Render Dashboard -> Service `srv-dbbo3h0473hc73d0dkqg` -> Deploys.
2. Select the previously verified live deployment and click **Rollback to this deploy**.
3. Alternatively, trigger a redeploy of the previous Git commit hash:
   ```bash
   curl -X POST https://api.render.com/v1/services/srv-dbbo3h0473hc73d0dkqg/deploys \
     -H "Authorization: Bearer $RENDER_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"clearCache": "clear"}'
   ```

### Database Migrations
- Prisma migrations are tracked under `packages/db/prisma/migrations/`.
- Schema changes are strictly additive whenever possible.
- If a schema migration must be reverted, deploy a compensating forward migration using `pnpm db:migrate`.

---

## 4. Observability & Health Probes

### Endpoints
- `GET /health/live`: Fast process liveness probe (returns HTTP 200).
- `GET /health/ready`: Readiness probe verifying PostgreSQL query readiness (returns HTTP 200/503).
- `GET /health`: Complete service health reporting DB status and Redis connectivity.
- `GET /metrics`: Standard Prometheus metrics export (requests, latency percentiles, rate limit blocks, budget drops).
