# Development guide

## Local setup

Install the backend dependencies and create a local environment file:

```bash
cd backend
npm install
cp .env.example .env
```

Configure `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` in `.env`. Use strong, unique secrets outside local development and never commit the `.env` file.

Apply the existing database migrations and generate Prisma Client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

Swagger UI is available at `http://localhost:5000/api-docs` while the server is running.

## Database migrations

During feature development, make intentional Prisma schema changes and create a descriptive migration:

```bash
npx prisma migrate dev --name descriptive_change_name
```

Before sharing a change, validate the schema and regenerate the client:

```bash
npx prisma validate
npx prisma generate
```

Treat committed migrations as history. Do not manually change Prisma’s migration metadata. If a local development database has disposable data and needs a clean replay, use Prisma’s development workflow rather than editing database internals.

## Branching

The feature-complete MVP is frozen on the `docs-and-production` branch. Create focused branches from the current working branch for individual documentation or production-engineering sprints, and keep unrelated work out of the same change set.

Use clear, conventional commit messages when commits are created, for example:

```text
docs: add architecture and development guides
feat(ci): add build and test workflow
```

## Coding standards

- Keep controllers limited to validation, service calls, and HTTP responses.
- Put business and authorization rules in services.
- Keep repositories focused on Prisma data access.
- Validate external input with Zod.
- Preserve the existing API response format unless an API change is intentional and documented.
- Keep migrations ordered and verify they replay on a fresh database before relying on them.

## Verification workflow

Run the build and tests from `backend/` before handing off a change:

```bash
npm run build
npm test
```

For database-affecting work, also run `npx prisma validate`, apply the migration to a local development database, and verify the migration sequence on a fresh database. For API changes, verify the relevant endpoints with Swagger UI, curl, or another HTTP client.
