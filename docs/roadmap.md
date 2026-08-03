# Roadmap

## Completed MVP milestones

- Foundation: TypeScript, Express, Prisma, PostgreSQL, and layered architecture
- Authentication: registration, login, logout, JWT access tokens, and refresh tokens
- Teams: CRUD, ownership, memberships, and role-based access control
- Projects: team-scoped project CRUD
- Tasks: CRUD, assignment, status, and priority
- Collaboration: task comments, activity logs, and database-backed notifications
- Quality: Prisma migration hygiene, unit and route tests, and OpenAPI/Swagger UI
- Documentation: README, architecture, development, deployment plan, and diagrams

## Production engineering roadmap

1. GitHub Actions: automated install, Prisma generate, build, lint, and test pipeline.
2. Security hardening: CORS policy, rate limiting, environment validation, and secure headers.
3. Redis: introduce targeted caching only where it has clear value.
4. Docker Compose: run the API, PostgreSQL, and Redis together locally.
5. NGINX: reverse proxy and production routing.
6. Cloud deployment: deploy the stack to AWS or Azure and document the operational workflow.

## Deferred ideas

- Attachments and file storage
- Real-time updates through WebSockets or server-sent events
- Email, push, or real-time notification delivery
- Mentions and mention parsing
- A frontend client

These are intentionally deferred until the core service is secure, automated, observable, and deployable.
