# Deployment plan

Deployment is intentionally not implemented yet. This document records the planned production shape so it can be implemented and verified in focused sprints.

## Planned components

- Docker Compose for the API, PostgreSQL, and Redis services
- Redis only for measured caching or future notification/session needs
- NGINX as the reverse proxy and TLS termination point
- GitHub Actions for build, Prisma validation, linting, and tests
- AWS or Azure for the production deployment target

## Before deployment

The production-engineering phase will add security configuration, environment validation, health checks, structured observability, and a documented rollback strategy. Credentials, domains, and cloud configuration will be documented only once the implementation exists.

Until then, use the local setup in [development.md](development.md).
