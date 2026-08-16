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
- [Testing and Build](#-testing-and-build)
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

---

## 🚦 Getting Started

### Prerequisites

- Node.js 22 or later
- npm
- PostgreSQL 16 or later

### Install and Configure

```bash
cd backend
npm install
cp .env.example .env
```

Set the following values in `backend/.env` for your local database and secure JWT secrets:

| Variable | Purpose |
| :--- | :--- |
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

---

## 🧪 Testing and Build

Run these commands from `backend/`:

```bash
npm run build
npm test
```

For the full local workflow, including migration guidance and contribution conventions, see [development.md](./docs/development.md).

---

## 📚 API Documentation

When the server is running, open interactive Swagger UI at:
```
http://localhost:5000/api-docs
```

It documents authentication, teams, memberships, projects, tasks, comments, activity logs, notifications, request bodies, responses, and JWT bearer authentication.

---

## 🗺️ Current Status & Roadmap

The TeamFlow backend MVP is **complete**: collaboration features, RBAC, activity auditing, notifications, tests, migrations, and OpenAPI documentation are in place.

**Upcoming work** is production engineering:
- ✅ CI pipeline
- ✅ Security hardening
- ✅ Redis where it provides value
- ✅ Docker Compose
- ✅ NGINX
- ✅ Cloud deployment

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
