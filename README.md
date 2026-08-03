# TeamFlow

TeamFlow is a production-style project-management backend inspired by Jira, ClickUp, Asana, and Trello. It gives teams a shared workspace for projects, tasks, comments, activity history, and in-app notifications.

The backend is designed as a learning and portfolio project with clear boundaries between HTTP delivery, business rules, and data access. The MVP is feature-complete; the next phase focuses on documentation, automation, security, and deployment quality.

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

## Technology stack

- Node.js and Express
- TypeScript
- PostgreSQL and Prisma ORM
- Docker for local infrastructure
- JWT and Zod
- Vitest
- Pino logging

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
├── backend/                 # TypeScript Express API
│   ├── prisma/              # Prisma schema and migrations
│   └── src/
│       ├── controllers/     # HTTP request/response handling
│       ├── middleware/      # Authentication and authorization
│       ├── repositories/    # Prisma-backed data access
│       ├── routes/          # API route registration
│       ├── services/        # Business rules and workflows
│       ├── validators/      # Zod request validation
│       └── docs/            # OpenAPI definition
├── docs/                    # Project documentation and diagrams
├── docker/                  # Container assets
└── frontend/                # Planned client application
```

## Getting started

### Prerequisites

- Node.js 22 or later
- npm
- PostgreSQL 16 or later

### Install and configure

```bash
cd backend
npm install
cp .env.example .env
```

Set the following values in `backend/.env` for your local database and secure JWT secrets:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime environment, such as `development` |
| `PORT` | HTTP port; defaults to `5000` in the example |
| `DATABASE_URL` | PostgreSQL connection URL used by Prisma |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |

Apply the migrations, generate Prisma Client, and start the development server:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

The API health endpoint is available at `http://localhost:5000/api/v1/health`.

## Testing and build

Run these commands from `backend/`:

```bash
npm run build
npm test
```

For the full local workflow, including migration guidance and contribution conventions, see [development.md](docs/development.md).

## API documentation

When the server is running, open interactive Swagger UI at:

```text
http://localhost:5000/api-docs
```

It documents authentication, teams, memberships, projects, tasks, comments, activity logs, notifications, request bodies, responses, and JWT bearer authentication.

## Current status

The TeamFlow backend MVP is complete: collaboration features, RBAC, activity auditing, notifications, tests, migrations, and OpenAPI documentation are in place.

Upcoming work is production engineering: CI, security hardening, Redis where it provides value, Docker Compose, NGINX, and cloud deployment. See the [roadmap](docs/roadmap.md).

## Further documentation

- [Architecture](docs/architecture.md)
- [Development guide](docs/development.md)
- [Deployment plan](docs/deployment.md)
- [Roadmap](docs/roadmap.md)
- [Diagrams](docs/diagrams/)
