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
