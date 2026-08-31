# 🚀 TeamFlow

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-1B222D?logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)](https://www.docker.com/)

> A production-style project-management backend inspired by Jira, ClickUp, Asana, and Trello. TeamFlow gives teams a shared workspace for projects, tasks, comments, activity history, and in-app notifications.

---

## 📖 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Repository Layout](#-repository-layout)
- [Getting Started](#-getting-started)
- [Local Service Endpoints](#local-service-endpoints)
- [Testing and Build](#testing-linting-and-build)
- [API Documentation](#-api-documentation)
- [Current Status & Roadmap](#-current-status--roadmap)
- [Further Documentation](#-further-documentation)

---

## ✨ Features

- 🔐 User registration, login, logout, JWT access tokens, and refresh tokens
- 🛡️ Role-based access control for `OWNER`, `ADMIN`, and `MEMBER`
- 👥 Teams, member invitations, removal, and role management
- 📁 Team projects and project lifecycle management
- ✅ Task CRUD, assignment, status, and priority
- 💬 Task comments with author and owner permissions
- 📜 Auditable activity logs for important collaboration events
- 🔔 Database-backed notifications for assignments, comments, and task completion
- ⚡ Redis-backed caching for high-throughput service queries
- 📖 Interactive OpenAPI 3.0 documentation through Swagger UI
- 📊 Prometheus and Grafana integration for real-time observability

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Runtime** | Node.js + Express |
| **Language** | TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Cache** | Redis + ioredis |
| **Containerization** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Validation** | JWT + Zod |
| **Security** | Helmet, CORS, Rate Limiting |
| **Testing** | Vitest |
| **Logging** | Pino |
| **Monitoring** | Prometheus + prom-client + Grafana |

---

## 🏗️ Architecture

The backend follows a clear layered architecture:

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


> 📘 See the [architecture guide](./docs/architecture.md) and [system diagrams](./docs/diagrams/) for request and authorization flows.

---

## 📂 Repository Layout

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


---

## 🚦 Getting Started

### Quickstart with Docker Compose

1. Clone the repository.
2. Create `backend/.env` from `backend/.env.example`.
3. Start the entire infrastructure stack (API, PostgreSQL, Redis, Prometheus, Grafana):

```bash
docker compose up --build -d
Direct Local Backend Development
If you prefer running Node.js natively on your machine:

Bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npm run dev
Environment Variables
Set the following keys in backend/.env:

Variable	Purpose
NODE_ENV	Runtime environment (e.g., development, production)
PORT	HTTP port (defaults to 5000)
DATABASE_URL	PostgreSQL connection URL used by Prisma
JWT_SECRET	Secret for signing access tokens
JWT_REFRESH_SECRET	Secret for signing refresh tokens
REDIS_URL	Connection string for Redis cache
Local Service Endpoints
Once the stack is running, these endpoints are available:

Plaintext
API Health:         http://localhost:5000/health
API v1 Health:      http://localhost:5000/api/v1/health
Swagger UI:         http://localhost:5000/api-docs
Prometheus:         http://localhost:9090
Grafana:            http://localhost:3000
Testing, Linting, and Build
Run these commands from backend/:

Bash
npm ci
npm run lint
npm run build
npm test
For full setup guidelines and contribution rules, see development.md.

📚 API Documentation
When the server is running, open interactive Swagger UI at:

http://localhost:5000/api-docs
It documents authentication, teams, memberships, projects, tasks, comments, activity logs, notifications, request bodies, responses, and JWT bearer authentication.

🗺️ Current Status & Roadmap
TeamFlow backend MVP and core production engineering milestones are complete:

✅ Core collaboration workflows, RBAC, and Notifications

✅ CI pipeline with lint, build, and unit tests

✅ Security hardening (Helmet, CORS, Rate Limiting, Zod)

✅ Redis caching layer with automatic invalidation

✅ Full Docker Compose stack with PostgreSQL, Redis, Prometheus, and Grafana

✅ Observability and metric collection

Upcoming Milestones:

⏳ NGINX reverse proxy setup

⏳ HTTPS/TLS certificate configuration

⏳ Cloud server deployment (AWS EC2 / Azure VM)

See the full roadmap.

📖 Further Documentation
Architecture Guide

Development Guide

Deployment Guide

Roadmap

Diagrams

📄 License
Distributed under the MIT License.


---

### Push the Cleaned File to GitHub

After replacing the content in `README.md` and saving it, run these commands in PowerShell at `C:\vs code project\Teamflow\Teamflow`:

```powershell
git add README.md
git commit -m "docs: resolve conflict markers in README"
git push origin docs-and-production
Your README.md on GitHub will be formatted and up to date!
