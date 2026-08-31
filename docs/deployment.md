# Deployment guide

## Current local deployment status

The project already supports a local, production-style container stack through Docker Compose.

### Implemented locally

- API service
- PostgreSQL database
- Redis cache
- Prometheus monitoring
- Grafana dashboards
- Health checks

### Not implemented yet

- NGINX reverse proxy
- TLS/HTTPS termination
- Public cloud deployment
- AWS deployment

## Local stack

The Compose configuration currently includes:

```text
Docker Compose
├── API
├── PostgreSQL
├── Redis
├── Prometheus
└── Grafana
```

Start the stack from the repository root:

```bash
docker compose up --build -d
```

Check the running services:

```bash
docker compose ps
```

## Service endpoints

```text
API:          http://localhost:5000
Health:       http://localhost:5000/health
API v1 health: http://localhost:5000/api/v1/health
Swagger:      http://localhost:5000/api-docs
Prometheus:   http://localhost:9090
Grafana:      http://localhost:3000
```

## Production roadmap

The next production milestone is to add an NGINX reverse proxy in front of the API and then move toward AWS deployment once account access is available.

```text
NGINX
  ↓
AWS deployment when account access is resolved
```

Until then, the local Compose stack remains the verified deployment target for development and validation.
