// ============================================================
// Stellar Pass — Health Check Utilities
// ============================================================

/**
 * Component health status.
 */
export type ComponentStatus = 'ok' | 'error' | 'degraded';

/**
 * Health check result for a single component.
 */
export interface ComponentHealth {
  status: ComponentStatus;
  message?: string;
  latency?: number;
  lastChecked?: string;
}

/**
 * Overall health check response.
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  components: Record<string, ComponentHealth>;
  metrics?: Record<string, number>;
}

/**
 * Create a health check response.
 */
export function createHealthResponse(
  components: Record<string, ComponentHealth>,
  options: {
    version?: string;
    uptime?: number;
    metrics?: Record<string, number>;
  } = {},
): HealthCheckResponse {
  const { version = '1.0.0', uptime = 0, metrics } = options;

  const componentStatuses = Object.values(components);
  const hasError = componentStatuses.some((c) => c.status === 'error');
  const hasDegraded = componentStatuses.some((c) => c.status === 'degraded');

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (hasError) {
    status = 'unhealthy';
  } else if (hasDegraded) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return {
    status,
    version,
    uptime,
    timestamp: new Date().toISOString(),
    components,
    ...(metrics && { metrics }),
  };
}

/**
 * Check if a health response indicates the service is ready.
 */
export function isHealthy(response: HealthCheckResponse): boolean {
  return response.status === 'healthy' || response.status === 'degraded';
}

/**
 * Get HTTP status code for a health response.
 */
export function getHealthStatusCode(response: HealthCheckResponse): number {
  switch (response.status) {
    case 'healthy':
      return 200;
    case 'degraded':
      return 200;
    case 'unhealthy':
      return 503;
    default:
      return 503;
  }
}

/**
 * Format uptime in seconds to human-readable string.
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Prometheus metric format helper.
 */
export function formatPrometheusMetric(
  name: string,
  value: number,
  help?: string,
  type?: 'counter' | 'gauge' | 'histogram',
): string {
  const lines: string[] = [];

  if (help) {
    lines.push(`# HELP ${name} ${help}`);
  }

  if (type) {
    lines.push(`# TYPE ${name} ${type}`);
  }

  lines.push(`${name} ${value}`);

  return lines.join('\n');
}
