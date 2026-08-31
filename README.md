# 🚀 TeamFlow

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-1B222D?logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)](https://www.docker.com/)

<<<<<<< HEAD
> A production-style project-management backend inspired by Jira, ClickUp, Asana, and Trello. TeamFlow gives teams a shared workspace for projects, tasks, comments, activity history, and in-app notifications.
=======
The backend is feature-complete for the core collaboration workflow and is now in its production-engineering phase: CI cleanup, security hardening, container orchestration, caching, and monitoring are all in place or actively being documented.
>>>>>>> 1282083 (fix: align ActivityLog metadata type boundary with Prisma JsonNull)

---

<<<<<<< HEAD
## 📖 Table of Contents
=======
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
>>>>>>> 1282083 (fix: align ActivityLog metadata type boundary with Prisma JsonNull)

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Repository Layout](#-repository-layout)
- [Getting Started](#-getting-started)
- [Testing and Build](#-testing-and-build)
- [API Documentation](#-api-documentation)
- [Current Status & Roadmap](#-current-status--roadmap)
- [Further Documentation](#-further-documentation)

<<<<<<< HEAD
---
=======
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
>>>>>>> 1282083 (fix: align ActivityLog metadata type boundary with Prisma JsonNull)

## ✨ Features

- 🔐 User registration, login, logout, JWT access tokens, and refresh tokens
- 🛡️ Role-based access control for `OWNER`, `ADMIN`, and `MEMBER`
- 👥 Teams, member invitations, removal, and role management
- 📁 Team projects and project lifecycle management
- ✅ Task CRUD, assignment, status, and priority
- 💬 Task comments with author and owner permissions
- 📜 Auditable activity logs for important collaboration events
- 🔔 Database-backed notifications for assignments, comments, and task completion
- 📖 Interactive OpenAPI 3.0 documentation through Swagger UI

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Runtime** | Node.js + Express |
| **Language** | TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Containerization** | Docker (local infrastructure) |
| **Validation** | JWT + Zod |
| **Testing** | Vitest |
| **Logging** | Pino |

---

## 🏗️ Architecture

The backend follows a clear layered architecture:

```
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

> 📘 See the [architecture guide](./docs/architecture.md) and [system diagram](./docs/diagram.md) for request and authorization flows.

---

## 📂 Repository Layout

```
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

---

## 🚦 Getting Started

### Local development workflow

<<<<<<< HEAD
- Node.js 22 or later
- npm
- PostgreSQL 16 or later

### Install and Configure
=======
1. Clone the repository.
2. Create `backend/.env` from `backend/.env.example`.
3. Install dependencies:
>>>>>>> 1282083 (fix: align ActivityLog metadata type boundary with Prisma JsonNull)

```bash
cd backend
npm install
```

<<<<<<< HEAD
Set the following values in `backend/.env` for your local database and secure JWT secrets:

| Variable | Purpose |
| :--- | :--- |
| `NODE_ENV` | Runtime environment, such as `development` |
| `PORT` | HTTP port; defaults to `5000` in the example |
| `DATABASE_URL` | PostgreSQL connection URL used by Prisma |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |

Apply the migrations, generate Prisma Client, and start the development server:
=======
4. Start the database and supporting services with Docker Compose from the project root:
>>>>>>> 1282083 (fix: align ActivityLog metadata type boundary with Prisma JsonNull)

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

<<<<<<< HEAD
---

## 🧪 Testing and Build
=======
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
>>>>>>> 1282083 (fix: align ActivityLog metadata type boundary with Prisma JsonNull)

Run these commands from `backend/`:

```bash
npm ci
npm run lint
npm run build
npm test
```

<<<<<<< HEAD
For the full local workflow, including migration guidance and contribution conventions, see [development.md](./docs/development.md).
=======
For the full local workflow and contribution conventions, see [development.md](docs/development.md).
>>>>>>> 1282083 (fix: align ActivityLog metadata type boundary with Prisma JsonNull)

---

## 📚 API Documentation

When the server is running, open interactive Swagger UI at:
```
http://localhost:5000/api-docs
```

It documents authentication, teams, memberships, projects, tasks, comments, activity logs, notifications, request bodies, responses, and JWT bearer authentication.

---

<<<<<<< HEAD
## 🗺️ Current Status & Roadmap

The TeamFlow backend MVP is **complete**: collaboration features, RBAC, activity auditing, notifications, tests, migrations, and OpenAPI documentation are in place.
=======
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
>>>>>>> 1282083 (fix: align ActivityLog metadata type boundary with Prisma JsonNull)

**Upcoming work** is production engineering:
- ✅ CI pipeline
- ✅ Security hardening
- ✅ Redis where it provides value
- ✅ Docker Compose
- ✅ NGINX
- ✅ Cloud deployment

<<<<<<< HEAD
👉 See the full [roadmap](./docs/roadmap.md).

---

## 📖 Further Documentation

- [Development Guide](./docs/development.md)
- [Architecture Guide](./docs/architecture.md)
- [System Diagram](./docs/diagram.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
```

---

### 🎨 Key Improvements Made

1.  **Visual Hierarchy**: Added a top banner with badges (MIT license, Node.js, TypeScript, etc.) to immediately show key tech.
2.  **Table of Contents**: Makes navigation easier for longer READMEs.
3.  **Emojis & Icons**: Used consistently in section headers to make it scannable.
4.  **Better Formatting**: Reorganized the stack into a clean table and used more descriptive headings.
5.  **Clear "Current Status & Roadmap"**: Separated the MVP completion from future work, making the project's stage very clear.
6.  **Added Licensing**: A common practice for open-source projects.

You can copy the code block above and replace your current `README.md` file. Adjust any links (like `./docs/architecture.md`) to match your actual file structure and document names.

If you want to customize any specific section further, just let me know!
=======
- [Architecture](docs/architecture.md)
- [Development guide](docs/development.md)
- [Deployment guide](docs/deployment.md)
- [Roadmap](docs/roadmap.md)
- [Diagrams](docs/diagrams/)
>>>>>>> 1282083 (fix: align ActivityLog metadata type boundary with Prisma JsonNull)
