// src/shell/health.ts
// Health and version endpoint implementations per MCP Infrastructure Blueprint

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Data freshness SLO thresholds (days) per category */
export const FRESHNESS_THRESHOLDS: Record<string, number> = {
  law: 30,
  security_controls: 90,
  cve: 7,
  sanctions: 3,
};

export interface DataFreshness {
  last_ingested: string;
  age_days: number;
  max_age_days: number;
  source_count?: number;
  record_count?: number;
  note?: string;
}

export interface HealthResponse {
  status: 'ok' | 'stale' | 'degraded';
  server: string;
  version?: string;
  git_sha?: string;
  uptime_seconds?: number;
  build_timestamp?: string;
  data_freshness?: DataFreshness;
  capabilities?: string[];
  tier?: string;
  error?: string;
}

export interface VersionResponse {
  name: string;
  version: string;
  git_sha: string;
  build_timestamp: string;
  node_version: string;
  transport: string[];
  mcp_sdk_version?: string | undefined;
  capabilities: string[];
  tier: string;
  source_schema_version: string;
  repo_url: string;
  report_issue_url: string;
}

export interface HealthConfig {
  server: string;
  version: string;
  gitSha: string;
  buildTimestamp: string;
  category: string;
  repoUrl: string;
  tier?: string;
  transport?: string[];
  mcpSdkVersion?: string;
  capabilities?: string[];
  getLastIngested: () => string | null;
  getSourceCount?: () => number;
  getRecordCount?: () => number;
  isDatabaseLoaded?: () => boolean;
}

const startTime = Date.now();

export function getHealthResponse(config: HealthConfig): HealthResponse {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  // Check if database is loaded (outage condition)
  if (config.isDatabaseLoaded && !config.isDatabaseLoaded()) {
    return {
      status: 'degraded',
      server: config.server,
      error: 'Database not loaded (cannot serve queries)',
    };
  }

  const lastIngested = config.getLastIngested();
  const maxAgeDays = FRESHNESS_THRESHOLDS[config.category] ?? 30;

  let ageDays = 0;
  if (lastIngested) {
    const ingestedDate = new Date(lastIngested);
    ageDays = Math.floor((Date.now() - ingestedDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  const isStale = ageDays > maxAgeDays;

  const freshness: DataFreshness = {
    last_ingested: lastIngested ?? 'unknown',
    age_days: ageDays,
    max_age_days: maxAgeDays,
  };

  if (config.getSourceCount) freshness.source_count = config.getSourceCount();
  if (config.getRecordCount) freshness.record_count = config.getRecordCount();
  if (isStale) freshness.note = 'Serving stale data (SLO breach) — upstream refresh overdue';

  return {
    status: isStale ? 'stale' : 'ok',
    server: config.server,
    version: config.version,
    git_sha: config.gitSha,
    uptime_seconds: uptimeSeconds,
    build_timestamp: config.buildTimestamp,
    data_freshness: freshness,
    capabilities: config.capabilities ?? [],
    tier: config.tier ?? 'free',
  };
}

export function getVersionResponse(config: HealthConfig): VersionResponse {
  return {
    name: config.server,
    version: config.version,
    git_sha: config.gitSha,
    build_timestamp: config.buildTimestamp,
    node_version: process.version,
    transport: config.transport ?? ['stdio'],
    mcp_sdk_version: config.mcpSdkVersion,
    capabilities: config.capabilities ?? [],
    tier: config.tier ?? 'free',
    source_schema_version: '1.0',
    repo_url: config.repoUrl,
    report_issue_url: `${config.repoUrl}/issues/new?template=data-error.md`,
  };
}

/**
 * Route handler for health and version endpoints.
 * Use in Vercel api/mcp.ts or any HTTP server:
 *
 * ```typescript
 * export async function GET(req: Request): Promise<Response> {
 *   const handled = handleInfraEndpoint(req, config);
 *   if (handled) return handled;
 *   return new Response('Not found', { status: 404 });
 * }
 * ```
 */
export function handleInfraEndpoint(req: Request, config: HealthConfig): Response | null {
  const url = new URL(req.url);

  if (url.pathname === '/health') {
    const health = getHealthResponse(config);
    const statusCode = health.status === 'degraded' ? 503 : 200;
    return Response.json(health, { status: statusCode });
  }

  if (url.pathname === '/version') {
    return Response.json(getVersionResponse(config));
  }

  return null;
}
