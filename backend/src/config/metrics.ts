import { Counter, Histogram, collectDefaultMetrics, register } from 'prom-client';
collectDefaultMetrics({ register, prefix: 'teamflow_' });
export const httpRequestDurationSeconds = new Histogram({ name: 'teamflow_http_request_duration_seconds', help: 'HTTP request duration in seconds', labelNames: ['method', 'route', 'status_code'], registers: [register] });
export const httpRequestsTotal = new Counter({ name: 'teamflow_http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status_code'], registers: [register] });
export { register };
