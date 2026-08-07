# Monitoring

TeamFlow exposes Prometheus metrics at `/metrics`. Docker Compose runs Prometheus at `http://localhost:9090` and Grafana at `http://localhost:3000`.

Grafana is provisioned with the `TeamFlow HTTP Overview` dashboard. It shows request rate and average request duration grouped by route using the `teamflow_http_requests_total` and `teamflow_http_request_duration_seconds` metrics.

The configured Grafana credentials are for local development only. Replace them before any public deployment.
