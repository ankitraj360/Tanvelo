export interface MetricsSnapshot {
  uptimeSeconds: number;
  totalRequests: number;
  statusCounts: Record<string, number>;
  rateLimitHits: number;
  budgetBlocks: number;
  providerErrors: Record<string, number>;
  fallbackCount: number;
  managementAuthFailures: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

class MetricsService {
  private startTime = Date.now();
  private totalRequests = 0;
  private statusCounts: Record<string, number> = {};
  private rateLimitHits = 0;
  private budgetBlocks = 0;
  private providerErrors: Record<string, number> = {};
  private fallbackCount = 0;
  private managementAuthFailures = 0;
  private latencies: number[] = [];
  private readonly maxLatencySamples = 1000;

  recordRequest(status: number, latencyMs: number, provider?: string, fallbacksUsed = 0) {
    this.totalRequests++;
    const statusKey = String(status);
    this.statusCounts[statusKey] = (this.statusCounts[statusKey] || 0) + 1;

    if (latencyMs >= 0) {
      if (this.latencies.length >= this.maxLatencySamples) {
        this.latencies.shift();
      }
      this.latencies.push(latencyMs);
    }

    if (fallbacksUsed > 0) {
      this.fallbackCount += fallbacksUsed;
    }
  }

  recordRateLimitHit() {
    this.rateLimitHits++;
  }

  recordBudgetBlock() {
    this.budgetBlocks++;
  }

  recordProviderError(provider: string) {
    this.providerErrors[provider] = (this.providerErrors[provider] || 0) + 1;
  }

  recordManagementAuthFailure() {
    this.managementAuthFailures++;
  }

  private calculatePercentile(p: number): number {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return Math.round(sorted[Math.max(0, Math.min(index, sorted.length - 1))]);
  }

  getSnapshot(): MetricsSnapshot {
    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests: this.totalRequests,
      statusCounts: { ...this.statusCounts },
      rateLimitHits: this.rateLimitHits,
      budgetBlocks: this.budgetBlocks,
      providerErrors: { ...this.providerErrors },
      fallbackCount: this.fallbackCount,
      managementAuthFailures: this.managementAuthFailures,
      p50LatencyMs: this.calculatePercentile(50),
      p95LatencyMs: this.calculatePercentile(95),
      p99LatencyMs: this.calculatePercentile(99),
    };
  }

  toPrometheus(isRedisOk: boolean): string {
    const s = this.getSnapshot();
    const lines: string[] = [
      '# HELP tanvelo_gateway_up Indicates whether the gateway service is operational',
      '# TYPE tanvelo_gateway_up gauge',
      'tanvelo_gateway_up 1',
      '',
      '# HELP tanvelo_gateway_uptime_seconds Process uptime in seconds',
      '# TYPE tanvelo_gateway_uptime_seconds gauge',
      `tanvelo_gateway_uptime_seconds ${s.uptimeSeconds}`,
      '',
      '# HELP tanvelo_redis_connected Distributed Redis rate limiter connection state',
      '# TYPE tanvelo_redis_connected gauge',
      `tanvelo_redis_connected ${isRedisOk ? 1 : 0}`,
      '',
      '# HELP tanvelo_requests_total Total HTTP requests handled by status code',
      '# TYPE tanvelo_requests_total counter',
    ];

    if (Object.keys(s.statusCounts).length === 0) {
      lines.push('tanvelo_requests_total{status="200"} 0');
    } else {
      for (const [status, count] of Object.entries(s.statusCounts)) {
        lines.push(`tanvelo_requests_total{status="${status}"} ${count}`);
      }
    }

    lines.push(
      '',
      '# HELP tanvelo_rate_limit_hits_total Number of requests rejected by rate limiting (HTTP 429)',
      '# TYPE tanvelo_rate_limit_hits_total counter',
      `tanvelo_rate_limit_hits_total ${s.rateLimitHits}`,
      '',
      '# HELP tanvelo_budget_blocks_total Number of requests blocked by budget limits (HTTP 429)',
      '# TYPE tanvelo_budget_blocks_total counter',
      `tanvelo_budget_blocks_total ${s.budgetBlocks}`,
      '',
      '# HELP tanvelo_fallback_executions_total Number of multi-hop fallback invocations executed',
      '# TYPE tanvelo_fallback_executions_total counter',
      `tanvelo_fallback_executions_total ${s.fallbackCount}`,
      '',
      '# HELP tanvelo_management_auth_failures_total Unauthenticated or rejected management API attempts',
      '# TYPE tanvelo_management_auth_failures_total counter',
      `tanvelo_management_auth_failures_total ${s.managementAuthFailures}`,
      '',
      '# HELP tanvelo_request_duration_ms Latency percentiles in milliseconds',
      '# TYPE tanvelo_request_duration_ms gauge',
      `tanvelo_request_duration_ms{quantile="0.50"} ${s.p50LatencyMs}`,
      `tanvelo_request_duration_ms{quantile="0.95"} ${s.p95LatencyMs}`,
      `tanvelo_request_duration_ms{quantile="0.99"} ${s.p99LatencyMs}`
    );

    for (const [provider, errCount] of Object.entries(s.providerErrors)) {
      lines.push(`tanvelo_provider_errors_total{provider="${provider}"} ${errCount}`);
    }

    return lines.join('\n') + '\n';
  }
}

export const metricsService = new MetricsService();
