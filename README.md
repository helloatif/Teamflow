# TeamFlow

TeamFlow is a production-style project-management backend inspired by Jira, ClickUp, Asana, and Trello. It gives teams a shared workspace for projects, tasks, comments, activity history, and in-app notifications.

The backend is feature-complete for the core collaboration workflow and is now in its production-engineering phase: CI cleanup, security hardening, container orchestration, caching, and monitoring are all in place or actively being documented.

## Features

- User registration, login, logout, JWT access tokens, and refresh tokens
- Role-based access control for `OWNER`, `ADMIN`, and `MEMBER`
- Teams, member invitations, removal, and role management
- Team projects and project lifecycle management
- Task CRUD, assignment, status, and priority
- Task comments with author and owner permissions
- Auditable activity logs for important collaboration events
- Database-backed notifications for assignments, comments, and task completion
- Interactive OpenAPI 3.0 documentation through Swagger UI
- Prometheus and Grafana monitoring for local observability

## Technology stack

- Runtime: Node.js + Express
- Language: TypeScript
- Database: PostgreSQL + Prisma ORM
- Cache: Redis + ioredis
- Containerization: Docker + Docker Compose
- CI/CD: GitHub Actions
- Validation: Zod
- Authentication: JWT
- Security: Helmet, CORS, rate limiting
- Testing: Vitest
- Logging: Pino
- Monitoring: Prometheus + prom-client + Grafana

## Architecture

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Prisma
  ↓
PostgreSQL
```

See the [architecture guide](docs/architecture.md) and [system diagram](docs/diagrams/system-architecture.md) for the request and authorization flows.

## Repository layout

```text
Teamflow/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── .env.example
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── development.md
│   ├── roadmap.md
│   └── diagrams/
├── monitoring/
│   ├── grafana/
│   └── prometheus/
├── docker-compose.yml
├── Makefile
├── README.md
└── .gitignore
```

## Getting started

### Local development workflow

1. Clone the repository.
2. Create `backend/.env` from `backend/.env.example`.
3. Install dependencies:

```bash
cd backend
npm install
```

4. Start the database and supporting services with Docker Compose from the project root:

```bash
cd ..
docker compose up --build -d
```

This starts the API, PostgreSQL, Redis, Prometheus, and Grafana locally.

### Direct backend development

If you want to run only the Node.js service locally:

```bash
cd backend
cp .env.example .env
npx prisma generate
npm run dev
```

### Environment variables

Set the following values in `backend/.env`:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime environment, such as `development` |
| `PORT` | HTTP port; defaults to `5000` |
| `DATABASE_URL` | PostgreSQL connection URL used by Prisma |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `REDIS_URL` | Redis connection string used by the cache service |

## Local service endpoints

Once the stack is running, these endpoints are available:

```text
API health:       http://localhost:5000/health
API v1 health:    http://localhost:5000/api/v1/health
Swagger UI:       http://localhost:5000/api-docs
Prometheus:       http://localhost:9090
Grafana:          http://localhost:3000
```

## Testing, linting, and build

Run these commands from `backend/`:

```bash
npm ci
npm run lint
npm run build
npm test
```

For the full local workflow and contribution conventions, see [development.md](docs/development.md).

## API documentation

When the server is running, open interactive Swagger UI at:

```text
http://localhost:5000/api-docs
```

It documents authentication, teams, memberships, projects, tasks, comments, activity logs, notifications, request bodies, responses, and JWT bearer authentication.

## Current status

TeamFlow is currently implemented and validated for:

- CI pipeline with install, Prisma generate, lint, build, and test checks
- Security hardening with Helmet, CORS, rate limiting, and environment validation
- Redis-backed caching for targeted use cases
- Docker Compose local orchestration with PostgreSQL, Redis, and monitoring services
- Prometheus + Grafana observability

Planned but not yet implemented:

- NGINX reverse proxy
- TLS/HTTPS termination
- Public cloud deployment
- AWS deployment pending account access

See the [roadmap](docs/roadmap.md) for the current sprint and next milestones.

## Further documentation

- [Architecture](docs/architecture.md)
- [Development guide](docs/development.md)
- [Deployment guide](docs/deployment.md)
- [Roadmap](docs/roadmap.md)
- [Diagrams](docs/diagrams/)
