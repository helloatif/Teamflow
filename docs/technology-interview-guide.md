# TeamFlow Technology and Interview Guide

This guide explains the technologies that are actually present in TeamFlow. File paths are relative to the repository root. It distinguishes implemented behavior from future infrastructure.

## System At A Glance

```text
Client
  |
  v
HTTP request
  |
  v
Express route
  |
  v
Security, metrics, authentication, and role middleware
  |
  v
Controller: parse input and format HTTP response
  |
  v
Service: business rules and orchestration
  |
  +--> CacheService --> Redis (optional fast path)
  |
  v
Repository interface
  |
  v
Prisma repository --> Prisma Client --> PostgreSQL
  |
  +--> activity logs and notifications
  |
  v
JSON response
  |
  +--> Pino logs
  +--> Prometheus metrics --> Grafana dashboards
```

A useful concrete endpoint is `GET /api/v1/projects/:projectId/tasks`. The request is routed in `backend/src/routes/tasks.ts`, authenticated by `authenticate`, checked for project membership by `authorizeProjectRole`, handled by `TaskController.list`, processed by `TaskService.listTasks`, optionally served by Redis, and otherwise loaded by `PrismaTaskRepository` from PostgreSQL.

TeamFlow does **not** currently contain a frontend application, NGINX configuration, Kubernetes manifests, Terraform configuration, TLS termination, or public cloud deployment. Those are future work, not completed technologies.

---

## 1. Node.js

### 1. WHAT IS IT?
Node.js is a runtime that executes JavaScript and TypeScript server programs outside a browser. It uses an event loop and non-blocking I/O so one process can coordinate many network and database operations.

### 2. WHAT PROBLEM DOES IT SOLVE?
A backend needs a process that listens for HTTP requests, performs I/O, and returns responses. Node.js provides that server runtime and its package ecosystem.

### 3. WHY WOULD A DEVELOPER USE IT?
It is effective for I/O-heavy APIs, has a large npm ecosystem, and lets teams use JavaScript or TypeScript across application layers.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow is an HTTP API with database, Redis, metrics, and logging I/O. Node.js fits that workload and supports the Express, Prisma, ioredis, and testing libraries used here.

### 5. WHERE IS IT USED?
`backend/package.json` declares the runtime-oriented scripts. `backend/src/server.ts` starts the process, while `backend/src/app.ts` creates the Express application. The Docker image is based on `node:22-alpine` in `backend/Dockerfile`.

### 6. WHAT EXACTLY IS IT DOING?
```text
npm start
  -> node dist/server.js
  -> server creates/listens with the Express app
  -> requests enter the event loop
  -> async services await PostgreSQL or Redis I/O
  -> JSON responses are written to clients
```

### 7. EXPLAIN THE COMPLETE FLOW
A request arrives at the Node process, Express dispatches it, asynchronous middleware and services perform I/O without blocking the event loop, and the response is sent when the awaited work completes. Errors move to Express's error handler.

### 8. REAL EXAMPLE
`TaskService.listTasks` awaits `cache.get` and, on a miss, awaits `taskRepository.findByProject`. Both operations are asynchronous Node.js work.

### 9. WHAT IF WE REMOVED IT?
There would be no runtime for the TypeScript output, so the API could not start.

### 10. WHY NOT AN ALTERNATIVE?
Python, Go, Java, or .NET could run the API. Node.js was a practical fit because the project already uses the TypeScript/npm ecosystem and has mostly I/O-bound behavior.

### 11. IMPORTANT CONCEPTS
Event loop, promises, async/await, non-blocking I/O, process environment variables, module loading, and graceful startup/shutdown.

### 12. INTERVIEW QUESTIONS
- Why is Node.js suitable for this API?
- What happens if CPU-heavy work runs on the event loop?
- How do promises and `async`/`await` affect request handling?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: What would you do for CPU-heavy work? Candidate: Move it to a worker process or queue rather than blocking the API event loop.
- Interviewer: Is Node.js single-threaded? Candidate: JavaScript execution is event-loop based, but Node can use the OS and worker mechanisms for I/O and parallel work.

### 14. STRONG NATURAL ANSWER
"We use Node.js to run the TypeScript API. Most TeamFlow work waits on PostgreSQL or Redis, so Node's asynchronous I/O model is a good fit. Express handles the HTTP layer while Node provides the process and runtime."

### 15. COMMON MISTAKES
Do not claim Node makes every operation parallel, or that it automatically solves CPU-heavy workloads.

### 16. DEPTH LEVEL
**MUST KNOW BASICS**

---

## 2. TypeScript

### 1. WHAT IS IT?
TypeScript is JavaScript with static type checking and language features that compile to JavaScript.

### 2. WHAT PROBLEM DOES IT SOLVE?
Large JavaScript systems can fail because values, function arguments, and return shapes are misunderstood. Types expose many mistakes before runtime.

### 3. WHY WOULD A DEVELOPER USE IT?
Types improve refactoring, editor feedback, API contracts, and readability while preserving JavaScript's runtime ecosystem.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow has many layers and domain values such as roles, task statuses, repositories, and authenticated requests. TypeScript helps keep those contracts aligned.

### 5. WHERE IS IT USED?
The backend source is TypeScript under `backend/src`. `backend/tsconfig.json` controls compilation, and `npm run build` runs `tsc -p tsconfig.json`.

### 6. WHAT EXACTLY IS IT DOING?
```text
Type annotations and interfaces
  -> tsc checks source contracts
  -> JavaScript is emitted to backend/dist
  -> Node executes the emitted JavaScript
```

### 7. EXPLAIN THE COMPLETE FLOW
A `TaskRepository` interface describes operations, `PrismaTaskRepository` implements it, and `TaskService` depends on the interface. This allows a service test to provide a substitute repository without changing business code.

### 8. REAL EXAMPLE
`AuthenticatedRequest` adds a typed `user` property to Express requests. `TaskService` receives typed task input and uses `TaskStatus` and `TaskPriority` types.

### 9. WHAT IF WE REMOVED IT?
The application could still run as JavaScript, but compile-time contracts, typed repository substitution, and many editor checks would be lost.

### 10. WHY NOT PLAIN JAVASCRIPT?
Plain JavaScript is simpler initially. TypeScript costs a build step but is more valuable as the layered codebase grows.

### 11. IMPORTANT CONCEPTS
Structural typing, interfaces, type-only imports, compile-time versus runtime checks, narrowing, and the fact that types disappear at runtime.

### 12. INTERVIEW QUESTIONS
- What does TypeScript check that Zod must check at runtime?
- Why use interfaces for repositories?
- Why can a TypeScript type not validate an HTTP request by itself?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: Why use Zod too? Candidate: TypeScript sees trusted source code at compile time, while Zod validates untrusted JSON at runtime.
- Interviewer: Does TypeScript protect production inputs? Candidate: Not alone; runtime schemas and business validation are required.

### 14. STRONG NATURAL ANSWER
"TypeScript gives TeamFlow explicit contracts between routes, services, and repositories. I still use Zod at the HTTP boundary because types are erased and cannot validate client-provided JSON at runtime."

### 15. COMMON MISTAKES
Do not say TypeScript validates database rows or request bodies at runtime.

### 16. DEPTH LEVEL
**MUST KNOW BASICS**

---

## 3. Express.js and REST HTTP

### 1. WHAT IS IT?
Express is a Node.js web framework. REST is an HTTP-oriented style in which resources are addressed by URLs and manipulated with methods such as GET, POST, PATCH, and DELETE.

### 2. WHAT PROBLEM DOES IT SOLVE?
An API needs routing, middleware composition, request parsing, response handling, and centralized error flow.

### 3. WHY WOULD A DEVELOPER USE IT?
Express is small, familiar, composable, and has mature middleware support.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow exposes a versioned collaboration API and needs authentication, role checks, validation, rate limiting, metrics, Swagger, and error handling around its routes.

### 5. WHERE IS IT USED?
`backend/src/app.ts` creates the app and registers global middleware. Route modules are in `backend/src/routes`, including `auth.ts`, `teams.ts`, `projects.ts`, `tasks.ts`, `comments.ts`, `notifications.ts`, and `health.ts`.

### 6. WHAT EXACTLY IS IT DOING?
```text
HTTP method + URL + JSON body
  -> Express matches a route
  -> middleware can reject or enrich the request
  -> controller calls a service
  -> controller returns status + JSON
  -> error middleware formats failures
```

### 7. EXPLAIN THE COMPLETE FLOW
For task creation, `POST /api/v1/projects/:projectId/tasks` passes through API rate limiting, `authenticate`, the manager role middleware, and `TaskController.create`. Zod parses the body. `TaskService.createTask` checks membership, writes through the repository, records activity, invalidates the project task cache, and the controller returns HTTP 201.

### 8. REAL EXAMPLE
`app.ts` mounts `createTasksRouter()` at `/api/v1/projects/:projectId/tasks`. The router maps `POST /` to `taskController.create` and `GET /` to `taskController.list`.

### 9. WHAT IF WE REMOVED IT?
The Node process could still run, but there would be no route/middleware framework to expose the API.

### 10. WHY NOT AN ALTERNATIVE?
Fastify, NestJS, Koa, or a Go framework are reasonable. Express was chosen for its minimal middleware model and established Node ecosystem.

### 11. IMPORTANT CONCEPTS
Middleware order, routers, route parameters, status codes, JSON serialization, `next`, idempotency, resource URLs, and separation of authentication from authorization.

### 12. INTERVIEW QUESTIONS
- Why is middleware order important in `app.ts`?
- Why is task routing nested under a project?
- What is the difference between 401 and 403?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: Why does authentication run before role authorization? Candidate: Authorization needs the identity that authentication extracted from the token.
- Interviewer: Why return 201 for creation? Candidate: It communicates that a new resource was successfully created.

### 14. STRONG NATURAL ANSWER
"Express is the HTTP boundary of TeamFlow. Routes map versioned resource URLs to controllers, middleware handles cross-cutting checks, and controllers translate between HTTP and application services. The business rules stay out of the route files."

### 15. COMMON MISTAKES
Do not describe Express as the database layer or claim REST itself provides authentication.

### 16. DEPTH LEVEL
**MUST KNOW DEEPLY**

---

## 4. Layered Architecture, Controllers, Services, and Repositories

### 1. WHAT IS IT?
Layered architecture separates responsibilities into boundaries. TeamFlow uses routes/middleware, controllers, services, repository interfaces, concrete Prisma repositories, and infrastructure clients.

### 2. WHAT PROBLEM DOES IT SOLVE?
Without boundaries, HTTP details, business rules, and SQL concerns become tangled and difficult to test or change.

### 3. WHY WOULD A DEVELOPER USE IT?
It improves cohesion, makes dependencies explicit, and permits unit tests with substitute repositories.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow has repeated authorization rules, cache invalidation, audit logging, notifications, and database operations. These need clear ownership.

### 5. WHERE IS IT USED?
Routes and controllers are in `backend/src/routes` and `backend/src/controllers`. Services are in `backend/src/services`. Interfaces and implementations are in `backend/src/repositories`.

### 6. WHAT EXACTLY IS IT DOING?
```text
Route: selects operation
  -> Controller: validates and translates HTTP
  -> Service: applies business rules
  -> Repository: performs persistence
  -> Infrastructure: PostgreSQL, Redis, or metrics
  -> Controller: formats response
```

### 7. EXPLAIN THE COMPLETE FLOW
`TaskController` never constructs Prisma queries. It calls `TaskService`; the service checks membership, calls `TaskRepository`, then coordinates activity, notification, and cache effects. `PrismaTaskRepository` translates the repository operation to Prisma.

### 8. REAL EXAMPLE
`createTasksRouter` constructs `TaskService` with `PrismaTaskRepository`, `ProjectService`, user/team repositories, activity and notification services, and `cacheService`.

### 9. WHAT IF WE REMOVED IT?
Features might still work, but testing would require more infrastructure and changes to persistence or HTTP behavior would spread across the codebase.

### 10. WHY NOT A SINGLE MVC CONTROLLER?
A single controller can be faster for a tiny API. TeamFlow's cross-feature rules and infrastructure integrations make explicit services and repositories worthwhile.

### 11. IMPORTANT CONCEPTS
Dependency injection, dependency inversion, single responsibility, cohesion, coupling, ports and adapters, and unit-test seams.

### 12. INTERVIEW QUESTIONS
- Why are permissions checked in services as well as middleware?
- Why does a repository not decide business permissions?
- How would you test `TaskService` without PostgreSQL?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: What if a service is called outside HTTP? Candidate: The service still enforces important business rules, which is why service-level checks matter.
- Interviewer: Is this fully hexagonal architecture? Candidate: It uses some ports-and-adapters ideas, especially repository interfaces, but it is a pragmatic layered design.

### 14. STRONG NATURAL ANSWER
"I keep controllers thin and put task rules in `TaskService`. The service depends on repository interfaces, so tests can use fakes, while production injects Prisma-backed implementations. That keeps Express and database details from becoming business logic."

### 15. COMMON MISTAKES
Do not claim every rule exists in only one layer or call this microservices architecture. It is a modular monolith.

### 16. DEPTH LEVEL
**MUST KNOW DEEPLY**

---

## 5. PostgreSQL and the Relational Model

### 1. WHAT IS IT?
PostgreSQL is an open-source relational database. It stores structured data in tables connected by keys and constrained by types, uniqueness, and relationships.

### 2. WHAT PROBLEM DOES IT SOLVE?
TeamFlow needs durable, queryable, consistent storage for users, teams, projects, tasks, comments, activity logs, and notifications.

### 3. WHY WOULD A DEVELOPER USE IT?
It provides transactions, constraints, joins, indexes, mature SQL, and reliable persistence.

### 4. WHY DID WE USE IT IN THIS PROJECT?
The domain has strong relationships: projects belong to teams, tasks belong to projects, users belong to teams through membership, and comments belong to tasks.

### 5. WHERE IS IT USED?
The database provider is configured in `backend/prisma/schema.prisma`. Compose runs `postgres:16-alpine` and persists data in the `postgres_data` volume.

### 6. WHAT EXACTLY IS IT DOING?
```text
Service operation
  -> Prisma repository query
  -> Prisma Client sends SQL to PostgreSQL
  -> constraints and relationships are enforced
  -> rows are returned or changed
  -> repository returns typed records
```

### 7. EXPLAIN THE COMPLETE FLOW
A task query uses `projectId`; PostgreSQL finds tasks associated with that project and orders them by `createdAt`. A task assignment updates `assigneeId`, which references `User`; deletion behavior is defined by Prisma relations such as cascade or set-null.

### 8. REAL EXAMPLE
`Project.teamId` references `Team`, `Task.projectId` references `Project`, and `TeamMember` has a unique compound constraint on `(userId, teamId)`. This prevents duplicate membership.

### 9. WHAT IF WE REMOVED IT?
Users, permissions, tasks, comments, audit history, and notifications would not survive process restarts.

### 10. WHY NOT A DOCUMENT DATABASE?
A document database could store nested collaboration objects, but PostgreSQL better expresses TeamFlow's relationships, constraints, and cross-entity queries.

### 11. IMPORTANT CONCEPTS
Primary keys, foreign keys, one-to-many relationships, many-to-many junction tables, normalization, indexes, transactions, constraints, cascading deletes, and connection pooling.

### 12. INTERVIEW QUESTIONS
- Why is `TeamMember` a junction table?
- What does `@@unique([userId, teamId])` protect?
- When would an index help the notification query?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: Why index `(recipientId, createdAt)`? Candidate: Notification listing filters by recipient and commonly orders or filters by creation time.
- Interviewer: What happens if a referenced team is deleted? Candidate: The declared relation behavior controls it; for projects and activity logs it includes cascading behavior.

### 14. STRONG NATURAL ANSWER
"PostgreSQL is TeamFlow's source of truth. The relational model fits because access is based on relationships between users, teams, projects, and tasks. Foreign keys and unique constraints protect those rules even if application code makes a mistake."

### 15. COMMON MISTAKES
Do not say Redis replaces PostgreSQL, or that foreign keys are merely TypeScript types.

### 16. DEPTH LEVEL
**MUST KNOW DEEPLY**

---

## 6. Prisma ORM and Migrations

### 1. WHAT IS IT?
Prisma is a TypeScript-friendly ORM and schema tool. It generates a typed client from a schema and manages database schema migrations.

### 2. WHAT PROBLEM DOES IT SOLVE?
Application code needs a safe, maintainable way to map domain operations to SQL without duplicating raw query strings and database types.

### 3. WHY WOULD A DEVELOPER USE IT?
It provides generated types, readable CRUD APIs, relation modeling, and migration history.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow's repository layer benefits from typed operations such as `findMany`, `findUnique`, `create`, `update`, and `delete`, while the schema captures the collaboration model.

### 5. WHERE IS IT USED?
The schema is `backend/prisma/schema.prisma`; generated client setup is in `backend/src/config/prisma.ts`. Prisma repositories are under `backend/src/repositories/prisma*.ts`. CI runs `npx prisma generate`; Compose runs `npx prisma migrate deploy`.

### 6. WHAT EXACTLY IS IT DOING?
```text
Prisma schema + migration history
  -> prisma generate
  -> generated Prisma Client
  -> repository method
  -> typed Prisma query
  -> SQL/PostgreSQL
  -> typed result
```

### 7. EXPLAIN THE COMPLETE FLOW
A repository calls `this.prisma.task.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } })`. Prisma Client turns that into database work and returns a record matching the generated model type. Migration files evolve the physical schema; `migrate deploy` applies them in a deployment environment.

### 8. REAL EXAMPLE
`PrismaTaskRepository.findByProject` queries tasks by project and newest creation time. `schema.prisma` defines enums for task status and priority and relations for creator, assignee, project, and comments.

### 9. WHAT IF WE REMOVED IT?
Repositories would need raw SQL or another data-access library, generated model contracts would disappear, and deployment schema management would need replacement tooling.

### 10. WHY NOT RAW SQL OR ANOTHER ORM?
Raw SQL offers maximum control but increases mapping and maintenance work. Sequelize, TypeORM, or Drizzle are valid alternatives. Prisma was chosen for generated TypeScript types and its schema/migration workflow.

### 11. IMPORTANT CONCEPTS
ORM mapping, generated client, migrations versus `db push`, N+1 queries, transactions, relation loading, indexes, and SQL still being the underlying database language.

### 12. INTERVIEW QUESTIONS
- Why must CI generate Prisma Client before build?
- What is the difference between a migration and a query?
- How would you avoid an N+1 relationship query?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: Why run `migrate deploy` in Compose? Candidate: It applies committed migrations to the container database before the API starts.
- Interviewer: Is Prisma a database? Candidate: No. PostgreSQL is the database; Prisma is the application data-access and schema tooling layer.

### 14. STRONG NATURAL ANSWER
"Prisma sits between TeamFlow repositories and PostgreSQL. The schema defines models and relations, `generate` creates a typed client, and repository methods use that client. The application does not treat the ORM as the source of truth; PostgreSQL still enforces relational persistence and committed migrations describe schema changes."

### 15. COMMON MISTAKES
Do not claim Prisma eliminates SQL knowledge, guarantees optimal queries, or replaces database constraints.

### 16. DEPTH LEVEL
**MUST KNOW DEEPLY**

---

## 7. JWT, bcryptjs, Authentication, and Authorization

### 1. WHAT IS IT?
JWT is a signed token format containing claims. Authentication establishes who a caller is; authorization decides what that caller may do. bcrypt is a password-hashing algorithm designed to make password guessing expensive.

### 2. WHAT PROBLEM DOES IT SOLVE?
An API must recognize a caller after login without storing a plaintext password or requiring every request to repeat credentials. It must also distinguish identity from permission.

### 3. WHY WOULD A DEVELOPER USE IT?
Signed access tokens support stateless request authentication, while bcrypt protects passwords if the database is exposed. Separate authorization rules express roles and memberships.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow is a REST API with protected team/project/task routes. JWT carries user identity between requests, and team membership plus roles control collaboration actions.

### 5. WHERE IS IT USED?
`backend/src/services/authService.ts` hashes and compares passwords and signs tokens. `backend/src/utils/jwt.ts` signs 15-minute access tokens and 7-day refresh tokens. `backend/src/middleware/authenticate.ts` verifies access tokens. `authorizeTeamRole.ts` and `authorizeProjectRole.ts` enforce membership/roles. Auth routes are in `backend/src/routes/auth.ts`.

### 6. WHAT EXACTLY IS IT DOING?
```text
Email + password
  -> AuthService finds user
  -> bcrypt.compare verifies password hash
  -> jwt.sign creates access and refresh tokens
  -> client stores/returns tokens
  -> client sends Authorization: Bearer <access token>
  -> authenticate verifies signature and extracts sub/email/role
  -> authorization checks team/project membership and role
  -> controller/service executes
```

The access token is signed with `JWT_SECRET` and expires in 15 minutes. The refresh token uses `JWT_REFRESH_SECRET` and expires in 7 days. The code exposes verification helpers for both; the documented current request middleware verifies access tokens. Logout increments `refreshTokenVersion` in the user record, but the shown token utility does not itself embed or check that version, so this should not be described as complete refresh-token revocation without checking the refresh endpoint and service behavior.

### 7. EXPLAIN THE COMPLETE FLOW
Missing or non-Bearer authorization produces 401. A malformed, expired, or invalid access token causes `jwt.verify` to throw and produces 401. A valid identity without membership or the required role reaches authorization middleware and produces 403. Valid requests continue to a service, which performs domain checks and persistence.

### 8. REAL EXAMPLE
`POST /api/v1/projects/:projectId/tasks` requires `authenticate` and a project role restricted to `OWNER` or `ADMIN`. `TaskService.assignTask` repeats the manager check before changing an assignee, then verifies the assignee belongs to the same team.

### 9. WHAT IF WE REMOVED IT?
Any caller could potentially reach protected operations, passwords would need unsafe handling, and the API could not reliably associate requests with users.

### 10. WHY NOT SESSIONS OR OAUTH?
Server sessions provide easy revocation but require shared session storage and session lookup. OAuth/OIDC is appropriate for delegated identity providers but adds an external identity flow. JWT was a direct fit for this API's own login model. In production, refresh rotation, secure storage, and explicit revocation checks should be reviewed.

### 11. IMPORTANT CONCEPTS
Claims, subject (`sub`), signature versus encryption, expiration, bearer-token risk, password hashing versus encryption, authentication versus authorization, least privilege, 401 versus 403, and token revocation.

### 12. INTERVIEW QUESTIONS
- What is in TeamFlow's JWT payload?
- Why are access and refresh tokens separate?
- What happens for a missing, malformed, expired, or unauthorized token?
- Why is bcrypt used instead of encrypting passwords?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: How do you know a token was not modified? Candidate: Verification checks its signature using the configured secret; a changed payload fails verification.
- Interviewer: Is a JWT encrypted? Candidate: Not by default. Its payload is encoded, so secrets must not be placed in it.
- Interviewer: How is logout enforced? Candidate: The service increments a refresh-token version, but the refresh path must compare that version for revocation to be effective; access tokens remain valid until expiry unless a denylist is added.

### 14. STRONG NATURAL ANSWER
"After login, TeamFlow compares the submitted password with the stored bcrypt hash and returns a short-lived access token plus a longer-lived refresh token. Protected routes require a Bearer access token. Authentication puts the user identity on the request; project authorization then checks the user's team membership and role. I would be careful to explain that JWT is signed rather than encrypted and that refresh revocation depends on the version being checked during refresh."

### 15. COMMON MISTAKES
Do not say JWT is encrypted, that possession of a bearer token is harmless, or that the current code provides instant access-token revocation. Do not confuse authentication with authorization.

### 16. DEPTH LEVEL
**MUST KNOW DEEPLY**

---

## 8. Zod Runtime Validation

### 1. WHAT IS IT?
Zod is a TypeScript-friendly runtime schema validation library.

### 2. WHAT PROBLEM DOES IT SOLVE?
HTTP JSON is untrusted runtime data. TypeScript declarations cannot inspect the actual body sent by a client.

### 3. WHY WOULD A DEVELOPER USE IT?
Schemas make accepted input explicit and provide safe parsed values or structured validation errors.

### 4. WHY DID WE USE IT IN THIS PROJECT?
Task creation and updates need limits and allowed enum values before business logic or database writes run.

### 5. WHERE IS IT USED?
`backend/src/validators/taskValidators.ts` defines title, description, status, priority, and assignee schemas. `TaskController` calls `safeParse` before service methods. Similar validators exist for auth, projects, comments, notifications, and activity logs.

### 6. WHAT EXACTLY IS IT DOING?
```text
req.body
  -> Zod safeParse
  -> parsed data on success
  -> controller calls service
  -> AppError 400 on failure
  -> errorHandler returns consistent JSON error
```

### 7. EXPLAIN THE COMPLETE FLOW
For task updates, Zod trims and limits title/description, restricts status to `TODO`, `IN_PROGRESS`, or `DONE`, restricts priority to `LOW`, `MEDIUM`, or `HIGH`, and rejects an empty patch. The service receives only parsed data.

### 8. REAL EXAMPLE
`createTaskSchema` requires a non-empty title no longer than 200 characters; `updateTaskAssigneeSchema` requires a non-empty string or null.

### 9. WHAT IF WE REMOVED IT?
Malformed, oversized, or unsupported values could reach services and database calls, increasing errors and attack surface.

### 10. WHY NOT manual checks or Joi?
Manual checks scatter rules and are easier to miss. Joi, class-validator, or JSON Schema are alternatives. Zod integrates naturally with TypeScript and the current functional controller style.

### 11. IMPORTANT CONCEPTS
Runtime boundary, parsing versus validation, coercion, refinements, unknown input, schema reuse, and error-to-HTTP mapping.

### 12. INTERVIEW QUESTIONS
- Why do we need Zod if TypeScript exists?
- What happens when `safeParse` fails?
- Why validate enum values before Prisma?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: Is validation enough for authorization? Candidate: No. Validation checks shape and values; authorization checks identity and permissions.
- Interviewer: Why use `safeParse`? Candidate: It returns a result that the controller can map to a controlled 400 instead of relying on an exception for expected invalid input.

### 14. STRONG NATURAL ANSWER
"Zod protects the boundary where JSON enters TeamFlow. For example, task status is restricted to the same values as the domain model and the title is trimmed and length-limited. Only parsed input reaches `TaskService`; invalid input becomes a 400 response."

### 15. COMMON MISTAKES
Do not claim Zod sanitizes every security issue, authenticates users, or replaces database constraints.

### 16. DEPTH LEVEL
**MUST KNOW DEEPLY**

---

## 9. Redis, ioredis, and Cache-Aside

### 1. WHAT IS IT?
Redis is an in-memory key-value data store. ioredis is the Node.js client used to communicate with it. A cache stores temporary copies of data to reduce repeated source-of-truth work.

### 2. WHAT PROBLEM DOES IT SOLVE?
Repeated task reads can add database latency and load. A cache can serve frequently requested results faster.

### 3. WHY WOULD A DEVELOPER USE IT?
Redis provides fast reads, expiration, atomic key operations, and a shared cache available to multiple API instances.

### 4. WHY DID WE USE IT IN THIS PROJECT?
Task lists and individual tasks are read often and change through known service operations, making cache-aside with invalidation practical.

### 5. WHERE IS IT USED?
`backend/src/config/redis.ts` configures ioredis and reconnect behavior. `backend/src/services/cacheService.ts` provides generic get/set/delete/clear operations. `TaskService` reads `task:<id>` and `tasks:project:<id>` and invalidates them after writes. Compose runs `redis:7-alpine` with AOF enabled.

### 6. WHAT EXACTLY IS IT DOING?
```text
Task read
  -> CacheService.get(key)
  -> hit: return JSON-parsed value
  -> miss: Prisma repository reads PostgreSQL
  -> CacheService.set(key, value, EX 300)
  -> return value

Task write
  -> PostgreSQL write succeeds
  -> delete item and project-list keys
  -> next read reloads fresh data
```

Cache errors are logged and treated as misses or ignored on writes/deletes, so Redis is an optimization rather than the source of truth.

### 7. EXPLAIN THE COMPLETE FLOW
`listTasks` first checks membership, then looks for `tasks:project:<projectId>`. A hit avoids PostgreSQL. A miss loads ordered tasks and caches them for the default 300 seconds. `createTask`, update, assignment, and delete invalidate affected keys.

### 8. REAL EXAMPLE
`TaskService.updateTask` calls `invalidate(projectId, task.id)`, which deletes both the individual task key and project list key.

### 9. WHAT IF WE REMOVED IT?
Reads would fall back to PostgreSQL and latency/load could increase, but core task correctness would remain because PostgreSQL is authoritative.

### 10. WHY NOT Memcached or in-process memory?
Memcached is simpler but has fewer data features. In-process memory is not shared between API replicas and disappears on restart. Redis was chosen as a shared, operationally useful cache.

### 11. IMPORTANT CONCEPTS
Cache-aside, hit/miss, TTL, invalidation, stale data, key design, serialization, cache stampede, fail-open behavior, and source of truth.

### 12. INTERVIEW QUESTIONS
- What happens on a cache hit or miss?
- Why invalidate after writes?
- What happens if Redis is unavailable?
- Why use `SCAN` in `clear` instead of blocking `KEYS`?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: Can stale data still occur? Candidate: Yes, especially if a write path misses invalidation or another writer changes the database; TTL limits its lifetime but does not eliminate the risk.
- Interviewer: Why does cache failure not fail the request? Candidate: The design treats caching as non-critical and preserves availability using PostgreSQL.

### 14. STRONG NATURAL ANSWER
"Redis is a performance layer around task reads, not the database of record. TeamFlow uses cache-aside: check Redis, query PostgreSQL on a miss, then set a five-minute value. Service write paths delete the individual and list keys, and Redis errors are logged while the request continues."

### 15. COMMON MISTAKES
Do not claim Redis guarantees fresh data, replaces PostgreSQL, or makes every request faster.

### 16. DEPTH LEVEL
**MUST KNOW DEEPLY**

---

## 10. Docker and Docker Compose

### 1. WHAT IS IT?
Docker packages an application and its dependencies into an image that runs as an isolated container. Compose describes and runs multiple related services.

### 2. WHAT PROBLEM DOES IT SOLVE?
Local environments often differ in installed runtimes, databases, ports, and configuration. Containers make the stack reproducible.

### 3. WHY WOULD A DEVELOPER USE IT?
It provides repeatable builds, service networking, health checks, persistent volumes, and a simple multi-service workflow.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow needs API, PostgreSQL, Redis, Prometheus, and Grafana together. Compose gives them a shared network and startup dependencies.

### 5. WHERE IS IT USED?
`backend/Dockerfile` builds the API with Node 22 Alpine, generates Prisma Client, compiles TypeScript, and exposes port 5000. `docker-compose.yml` defines `api`, `postgres`, `redis`, `prometheus`, and `grafana`, plus networks, volumes, and health checks.

### 6. WHAT EXACTLY IS IT DOING?
```text
docker compose up --build -d
  -> build API image
  -> start PostgreSQL and wait for health
  -> start API, deploy migrations, run dist/server.js
  -> API health check becomes ready
  -> start Prometheus and Grafana
```

Compose service names become network DNS names, so the API uses `postgres` and `redis` rather than localhost internally.

### 7. EXPLAIN THE COMPLETE FLOW
PostgreSQL stores data in `postgres_data`; Redis is reachable at `redis:6379`; the API is published at host port 5000 and checks `/health`; Prometheus scrapes `api:5000/metrics`; Grafana reads Prometheus through provisioned configuration and displays the dashboard.

### 8. REAL EXAMPLE
The API command builds `DATABASE_URL` from the Compose PostgreSQL environment, runs `npx prisma migrate deploy`, then starts `node dist/server.js`. The API health check uses `wget` against `http://localhost:5000/health`.

### 9. WHAT IF WE REMOVED IT?
Developers would need to install and configure each service manually. The application code would still exist, but the reproducible local stack would disappear.

### 10. WHY NOT Kubernetes?
Kubernetes is designed for larger-scale orchestration and operational control. Compose is enough for this local multi-container stack. No Kubernetes manifests exist in this repository.

### 11. IMPORTANT CONCEPTS
Image versus container, layers, build context, port publishing, bridge networks, volumes, environment variables, health checks, `depends_on`, and container DNS.

### 12. INTERVIEW QUESTIONS
- Why is `localhost` wrong for API-to-PostgreSQL communication in Compose?
- What does a volume preserve?
- Does `depends_on` alone prove an application is ready?
- Why run migrations before starting the API?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: What does the API health check prove? Candidate: It proves the HTTP process responds, not that every dependency or business operation is healthy.
- Interviewer: Is this production cloud deployment? Candidate: No. It is a local/containerized stack; NGINX, TLS, and cloud infrastructure are not implemented.

### 14. STRONG NATURAL ANSWER
"Compose is TeamFlow's local orchestration layer. It runs the API, PostgreSQL, Redis, Prometheus, and Grafana on one bridge network, with named volumes for state and health checks for startup coordination. The API container applies Prisma migrations before serving traffic."

### 15. COMMON MISTAKES
Do not claim Compose is Kubernetes, that a container is a VM, or that this repository has a completed AWS deployment.

### 16. DEPTH LEVEL
**MUST KNOW DEEPLY**

---

## 11. Security Middleware: Helmet, CORS, and Rate Limiting

### 1. WHAT IS IT?
Helmet sets HTTP security headers. CORS controls which browser origins may call the API. Rate limiting restricts request volume over a time window.

### 2. WHAT PROBLEM DOES IT SOLVE?
Web APIs face browser-origin abuse, common header-related risks, and brute-force or denial-of-service pressure.

### 3. WHY WOULD A DEVELOPER USE IT?
These controls provide baseline defenses that are easy to apply centrally.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow has login endpoints and a browser-facing API. `app.ts` applies Helmet, CORS, and rate limiters before route work.

### 5. WHERE IS IT USED?
`backend/src/middleware/security.ts` defines CORS, a general limit of 100 requests per 15 minutes, and an auth limit of 10 per 15 minutes. `backend/src/app.ts` registers Helmet, CORS, and the limiters.

### 6. WHAT EXACTLY IS IT DOING?
```text
Request
  -> Helmet adds response headers
  -> CORS checks Origin
  -> API/auth limiter checks request count
  -> rejected request gets 403 or 429
  -> accepted request continues to routing
```

### 7. EXPLAIN THE COMPLETE FLOW
An unapproved browser origin receives a CORS rejection. A client exceeding the configured window receives 429 and a warning log. The authentication limiter is stricter than the general API limiter to reduce login abuse.

### 8. REAL EXAMPLE
`corsOptions` allows origins in `env.CORS_ORIGINS`, allows credentials, and permits Authorization and Content-Type headers.

### 9. WHAT IF WE REMOVED IT?
Browser policy would be less controlled, baseline response protections would disappear, and brute-force or excessive request traffic would be less constrained.

### 10. WHY NOT rely only on a reverse proxy or WAF?
A proxy/WAF is valuable at the edge but does not replace application-level policy. TeamFlow currently has no NGINX or cloud edge implementation.

### 11. IMPORTANT CONCEPTS
Same-origin policy, preflight requests, credentials, security headers, fixed-window limiting, trusted proxy/IP configuration, and defense in depth.

### 12. INTERVIEW QUESTIONS
- What is the difference between CORS and authentication?
- Why is the auth limiter stricter?
- What status code represents rate-limit rejection?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: Does CORS protect non-browser clients? Candidate: No; it is a browser enforcement mechanism, so server-side authentication and authorization remain necessary.
- Interviewer: What would you revisit behind a proxy? Candidate: Correct client IP/trust-proxy configuration and distributed rate-limit storage.

### 14. STRONG NATURAL ANSWER
"These are baseline application defenses. Helmet sets headers, CORS restricts configured browser origins, and express-rate-limit applies 100 requests per 15 minutes generally and 10 for authentication. They complement, rather than replace, JWT and authorization."

### 15. COMMON MISTAKES
Do not call CORS an access-control system for all clients or claim rate limiting prevents all denial-of-service attacks.

### 16. DEPTH LEVEL
**MUST KNOW BASICS**

---

## 12. Prometheus, prom-client, and Grafana

### 1. WHAT IS IT?
Prometheus is a metrics collection and time-series system. `prom-client` exposes Node metrics. Grafana visualizes metrics in dashboards.

### 2. WHAT PROBLEM DOES IT SOLVE?
Logs describe individual events, but operators also need trends such as request volume, status codes, latency, and process health.

### 3. WHY WOULD A DEVELOPER USE IT?
Metrics support dashboards, alerting, capacity analysis, and performance investigation.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow already has an HTTP API and needs observable local operations without adding a hosted monitoring service.

### 5. WHERE IS IT USED?
`backend/src/config/metrics.ts` defines default metrics, an HTTP duration histogram, and an HTTP request counter. `backend/src/middleware/metrics.ts` records finished responses. `app.ts` exposes `/metrics`. Compose and `monitoring/prometheus/prometheus.yml` run Prometheus, while Grafana provisioning is under `monitoring/grafana/provisioning`.

### 6. WHAT EXACTLY IS IT DOING?
```text
HTTP response finish
  -> metricsMiddleware computes method/route/status labels
  -> histogram observes duration
  -> counter increments
  -> GET /metrics exposes Prometheus format
  -> Prometheus scrapes api:5000/metrics every 15 seconds
  -> Grafana queries Prometheus and renders dashboards
```

### 7. EXPLAIN THE COMPLETE FLOW
A request to a task endpoint is timed from middleware start until response finish. The route label, method, and status code are recorded. Prometheus periodically scrapes the endpoint, and Grafana uses the stored time series for the TeamFlow overview dashboard.

### 8. REAL EXAMPLE
Metrics include `teamflow_http_request_duration_seconds` and `teamflow_http_requests_total`, with `method`, `route`, and `status_code` labels.

### 9. WHAT IF WE REMOVED IT?
The API would still serve requests, but latency and request-volume visibility would be lost.

### 10. WHY NOT only Pino logs or a hosted APM?
Logs are useful for event detail but harder to aggregate for latency trends. Hosted APM may be better for production but adds cost and external dependency. Prometheus/Grafana are appropriate for this local stack.

### 11. IMPORTANT CONCEPTS
Counter, histogram, labels, cardinality, scrape model, pull endpoint, time series, RED metrics, dashboards, and alerting.

### 12. INTERVIEW QUESTIONS
- Why use a histogram for duration?
- Why record metrics on response finish?
- What is a dangerous metric label?
- What is the difference between Prometheus and Grafana?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: Why use route rather than raw URL? Candidate: Route templates avoid a new time series for every task ID and reduce label cardinality.
- Interviewer: Does a scrape prove the API is healthy? Candidate: It proves metrics can be collected; `/health` and dependency checks answer different questions.

### 14. STRONG NATURAL ANSWER
"TeamFlow exposes Prometheus metrics from the API. Middleware records request count and duration with bounded method, route, and status labels. Prometheus scrapes `/metrics`, and Grafana reads those time series for local dashboards."

### 15. COMMON MISTAKES
Do not confuse metrics with logs, or add user IDs and arbitrary request URLs as high-cardinality labels.

### 16. DEPTH LEVEL
**MUST KNOW BASICS**

---

## 13. Pino Logging and Error Handling

### 1. WHAT IS IT?
Pino is a structured JSON logger. Error middleware is the centralized mechanism that turns failures into HTTP responses.

### 2. WHAT PROBLEM DOES IT SOLVE?
Operators need searchable context for failures, and clients need consistent error responses rather than uncaught exceptions.

### 3. WHY WOULD A DEVELOPER USE IT?
Structured logs are machine-readable and centralized error handling prevents duplicated response logic.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow has Redis events, security events, startup state, and request failures that need consistent context.

### 5. WHERE IS IT USED?
`backend/src/config/logger.ts` configures Pino. `backend/src/middleware/errorHandler.ts` logs failures and formats `errorResponse`. Security, Redis, cache, and application modules use the logger.

### 6. WHAT EXACTLY IS IT DOING?
```text
Failure or lifecycle event
  -> logger receives message + structured fields
  -> Pino writes structured output
  -> request error reaches errorHandler
  -> status code/message are selected
  -> client receives JSON error
```

### 7. EXPLAIN THE COMPLETE FLOW
A missing task eventually throws `AppError` with status 404. Express forwards it to `errorHandler`, which logs method/path/status and returns a JSON error. Unexpected errors become 500 with a generic client message.

### 8. REAL EXAMPLE
The rate-limit handler logs `event`, method, path, and IP before returning 429. Cache failures log the key and continue.

### 9. WHAT IF WE REMOVED IT?
Failures would be harder to diagnose and clients could receive inconsistent or leaked error output.

### 10. WHY NOT console.log?
`console.log` lacks consistent structure, levels, and production-oriented serialization. Winston is a reasonable alternative; Pino is lightweight and fast.

### 11. IMPORTANT CONCEPTS
Log levels, structured fields, correlation IDs, sensitive-data redaction, operational versus client errors, and generic 500 responses.

### 12. INTERVIEW QUESTIONS
- Why should a 500 response not expose the raw error?
- What should never be logged?
- Why centralize error handling?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: How would you trace one request across services? Candidate: Add a request or correlation ID to logs and propagate it through downstream calls.
- Interviewer: Is logging a replacement for metrics? Candidate: No; logs explain events, metrics summarize behavior over time.

### 14. STRONG NATURAL ANSWER
"Pino gives TeamFlow structured operational logs, while `errorHandler` gives clients a consistent error contract. Known `AppError` statuses are preserved, unexpected errors become a generic 500, and the server logs the detailed context."

### 15. COMMON MISTAKES
Do not log passwords, tokens, or sensitive request bodies, and do not return stack traces to clients in production.

### 16. DEPTH LEVEL
**MUST KNOW BASICS**

---

## 14. Vitest and Testing Strategy

### 1. WHAT IS IT?
Vitest is a JavaScript/TypeScript test runner with assertions, mocks, and fast test execution.

### 2. WHAT PROBLEM DOES IT SOLVE?
Changes need repeatable checks that detect regressions in authentication, routes, services, and health behavior.

### 3. WHY WOULD A DEVELOPER USE IT?
It integrates well with TypeScript and supports fast unit and integration-style tests.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow's layered design allows service tests with repository doubles and route tests around Express behavior.

### 5. WHERE IS IT USED?
`backend/vitest.config.ts` configures the Node environment. Tests are under `backend/src/tests`, including auth, JWT, health, task, project, team, comment, activity-log, and notification tests. `npm test` runs `vitest run`.

### 6. WHAT EXACTLY IS IT DOING?
```text
npm test
  -> Vitest discovers tests
  -> test doubles or app setup exercise behavior
  -> assertions check result/status/error
  -> non-zero exit means CI fails
```

### 7. EXPLAIN THE COMPLETE FLOW
A service test can inject fake repositories and assert business rules without starting PostgreSQL. A route test can send an HTTP-like request through the app and assert status and JSON. CI runs the same command after build.

### 8. REAL EXAMPLE
`backend/src/tests/jwt.auth.test.ts` covers token authentication behavior, while task and project route/service tests cover authorization and domain operations.

### 9. WHAT IF WE REMOVED IT?
The application might still run, but regressions could reach CI or production undetected.

### 10. WHY NOT Jest or only manual testing?
Jest is a valid alternative. Manual testing is slow and non-repeatable; Vitest matches this TypeScript setup.

### 11. IMPORTANT CONCEPTS
Unit versus integration tests, test doubles, deterministic tests, assertions, setup/teardown, isolation, and test coverage versus test quality.

### 12. INTERVIEW QUESTIONS
- What should be unit tested in `TaskService`?
- Why mock repositories?
- What is the difference between a route test and a service test?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: What would you add next? Candidate: Failure-path tests for Redis/database outages, refresh-token behavior, and a full Compose smoke test.
- Interviewer: Does passing tests prove production readiness? Candidate: No; tests cover selected behavior and should be combined with build, lint, configuration, and operational checks.

### 14. STRONG NATURAL ANSWER
"TeamFlow uses Vitest for service and route coverage. The repository interfaces make business rules testable without requiring a real database, while route tests verify HTTP behavior. CI runs the suite after Prisma generation and compilation."

### 15. COMMON MISTAKES
Do not claim the test suite proves every failure mode or that line coverage alone proves correctness.

### 16. DEPTH LEVEL
**MUST KNOW BASICS**

---

## 15. GitHub Actions CI/CD

### 1. WHAT IS IT?
GitHub Actions is a workflow automation service triggered by repository events. CI continuously installs, checks, builds, and tests code.

### 2. WHAT PROBLEM DOES IT SOLVE?
A developer's local machine is not a reliable shared quality gate. Automation checks pull requests and pushes consistently.

### 3. WHY WOULD A DEVELOPER USE IT?
It gives repeatable checks, visible failures, and an integration point for later delivery automation.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow needs lint, Prisma generation, TypeScript compilation, and tests to agree before changes are accepted.

### 5. WHERE IS IT USED?
`.github/workflows/ci.yml` runs on pushes and pull requests to `main` and `docs-and-production`. Its backend working directory runs `npm ci`, `npx prisma generate`, `npm run lint`, `npm run build`, and `npm test`.

### 6. WHAT EXACTLY IS IT DOING?
```text
Push or pull request
  -> checkout
  -> setup Node 22 + npm cache
  -> npm ci
  -> Prisma generate
  -> ESLint
  -> TypeScript build
  -> Vitest
  -> failed step fails the job
```

### 7. EXPLAIN THE COMPLETE FLOW
The workflow provides test environment variables, installs the lockfile-defined dependencies, generates the client needed by TypeScript, checks style/errors, compiles, and executes tests. It is CI; it does not deploy TeamFlow to AWS.

### 8. REAL EXAMPLE
The lint step is `npm run lint`, and the workflow uses `backend/package-lock.json` for npm caching and installation.

### 9. WHAT IF WE REMOVED IT?
Quality checks would depend on individual developers remembering and correctly running them.

### 10. WHY NOT deploy from this workflow now?
Deployment requires infrastructure, secrets, environments, rollback policy, and cloud account access. Those are not implemented in this repository.

### 11. IMPORTANT CONCEPTS
Triggers, jobs, runners, working directories, immutable lockfile installs, environment variables, artifacts, secrets, branch protection, and CI versus CD.

### 12. INTERVIEW QUESTIONS
- Why generate Prisma Client before build?
- Why use `npm ci` instead of `npm install` in CI?
- What makes this CI rather than full CD?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: What happens when lint fails? Candidate: The job stops with a non-zero result and the pull request check fails.
- Interviewer: How would you add deployment? Candidate: First define a target environment, secrets, image registry, migration strategy, health checks, rollback, and protected approvals.

### 14. STRONG NATURAL ANSWER
"Our GitHub Actions workflow is a quality gate. It uses Node 22, installs exactly from the lockfile, generates Prisma Client, runs ESLint, builds TypeScript, and runs Vitest. It validates code but does not claim to deploy TeamFlow."

### 15. COMMON MISTAKES
Do not call a build-and-test workflow cloud deployment, and do not skip lockfile installation or generated-client setup.

### 16. DEPTH LEVEL
**MUST KNOW BASICS**

---

## 16. Swagger/OpenAPI

### 1. WHAT IS IT?
OpenAPI is a machine-readable description format for HTTP APIs. Swagger UI renders interactive documentation from that description.

### 2. WHAT PROBLEM DOES IT SOLVE?
Clients and developers need to discover routes, inputs, and responses without reading every implementation file.

### 3. WHY WOULD A DEVELOPER USE IT?
It improves API discoverability and can support client generation and manual testing.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow exposes multiple versioned resource routes and needs a local API reference.

### 5. WHERE IS IT USED?
`backend/src/docs/swagger.ts` defines the specification. `backend/src/app.ts` serves Swagger UI at `/api-docs`.

### 6. WHAT EXACTLY IS IT DOING?
```text
OpenAPI definitions
  -> swagger-jsdoc builds specification
  -> swagger-ui-express renders it
  -> browser opens /api-docs
  -> developer inspects or calls documented endpoints
```

### 7. EXPLAIN THE COMPLETE FLOW
A developer opens `http://localhost:5000/api-docs`, reads the route contract, supplies a request, and the request follows the same Express/middleware/service flow as any client request.

### 8. REAL EXAMPLE
The API mounts `swaggerUi.serve` and `swaggerUi.setup(swaggerSpec)` at `/api-docs`.

### 9. WHAT IF WE REMOVED IT?
The API could still run, but interactive local API discovery would be lost.

### 10. WHY NOT hand-written Markdown only?
Markdown is useful for narrative docs but is less structured and interactive than an OpenAPI document.

### 11. IMPORTANT CONCEPTS
Schema, endpoint contract, parameters, request body, response shape, authentication schemes, and documentation drift.

### 12. INTERVIEW QUESTIONS
- Where is Swagger served?
- How can API docs become stale?
- What is the relationship between OpenAPI and Express?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: Does Swagger enforce validation? Candidate: Not by itself; the actual controllers and Zod schemas enforce runtime behavior.
- Interviewer: How would you prevent drift? Candidate: Test documented routes and keep the specification close to route changes.

### 14. STRONG NATURAL ANSWER
"Swagger UI gives TeamFlow a browser-accessible API contract at `/api-docs`. It documents and explores the Express API, but it does not replace authentication, Zod validation, or tests."

### 15. COMMON MISTAKES
Do not say Swagger is the API framework or that documentation automatically guarantees implementation accuracy.

### 16. DEPTH LEVEL
**SHOULD KNOW**

---

## 17. Environment Configuration and npm

### 1. WHAT IS IT?
Environment variables are runtime configuration values. `dotenv` loads values from an env file, and npm manages the Node package manifest, lockfile, and scripts.

### 2. WHAT PROBLEM DOES IT SOLVE?
Secrets, ports, database URLs, and environment-specific settings should not be hard-coded into source code.

### 3. WHY WOULD A DEVELOPER USE IT?
Configuration can vary between development, CI, and containers without changing application logic.

### 4. WHY DID WE USE IT IN THIS PROJECT?
TeamFlow needs database, JWT, Redis, CORS, port, and environment settings in local and CI/container runs.

### 5. WHERE IS IT USED?
`backend/src/config/env.ts` validates/exports configuration, while `backend/package.json` defines scripts and dependencies. Compose loads `backend/.env` by default and overrides the internal Redis URL.

### 6. WHAT EXACTLY IS IT DOING?
```text
process environment / .env
  -> env configuration module
  -> Prisma, JWT, Redis, logger, and Express read configuration
  -> runtime behavior changes by environment
```

### 7. EXPLAIN THE COMPLETE FLOW
Local Compose loads database credentials from `backend/.env`, constructs the internal database URL for the API container, and passes Redis as `redis://redis:6379`. CI supplies safe test values in the workflow environment.

### 8. REAL EXAMPLE
`JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `REDIS_URL`, `PORT`, and CORS configuration are consumed by the backend.

### 9. WHAT IF WE REMOVED IT?
Configuration would need to be hard-coded or passed manually, increasing portability and secret-management risks.

### 10. WHY NOT commit a single config file?
Committed secrets are unsafe and one config cannot represent local, CI, and production environments correctly.

### 11. IMPORTANT CONCEPTS
Configuration validation, secret rotation, precedence, twelve-factor principles, lockfiles, `npm ci`, and never logging secrets.

### 12. INTERVIEW QUESTIONS
- Why is the Compose Redis host not `localhost`?
- Why should secrets not be committed?
- Why use `npm ci` in CI?

### 13. FOLLOW-UP QUESTIONS
- Interviewer: What should happen when a required variable is missing? Candidate: Startup should fail clearly rather than silently using an unsafe default, especially for production secrets.
- Interviewer: Are the JWT fallback secrets production-safe? Candidate: No; they are development fallbacks and production must provide strong configured secrets.

### 14. STRONG NATURAL ANSWER
"TeamFlow keeps runtime settings outside the code. The environment module centralizes configuration, Compose supplies service-specific values, and CI defines isolated test values. Secrets must be supplied securely and not committed."

### 15. COMMON MISTAKES
Do not claim `.env` files are automatically secure, or that the development JWT fallbacks are acceptable for production.

### 16. DEPTH LEVEL
**MUST KNOW BASICS**

---

## 18. Concepts Mentioned But Not Implemented

### Kubernetes
Kubernetes orchestrates containers at larger scale using objects such as Pods, Deployments, and Services. It solves scheduling, self-healing, scaling, and service discovery problems that Compose does not target. TeamFlow has no Kubernetes manifests, so there is no TeamFlow Pod, Deployment, Service, or `ImagePullBackOff` flow to explain as an implemented feature. The interview-safe answer is: "Kubernetes is a planned deployment technology, not part of this repository's current runtime."

### Terraform
Terraform is an infrastructure-as-code tool that describes cloud resources through providers, resources, state, plan, and apply operations. It solves repeatable infrastructure provisioning. TeamFlow has no Terraform files and has provisioned no AWS resources through Terraform.

### NGINX, TLS, and Cloud/AWS Deployment
These are future production-engineering work. The current stack is a local Docker Compose deployment. There is no NGINX reverse proxy, HTTPS certificate termination, AWS environment, cloud load balancer, or deployment workflow in the repository. Do not claim otherwise in an interview.

### Frontend
The inspected repository contains the backend, documentation, monitoring, and Compose configuration, but no frontend application directory. Do not describe React or a completed client implementation as part of TeamFlow unless one is added later.

---

## Complete TeamFlow Request Example

This is the flow to explain in an interview for `POST /api/v1/projects/:projectId/tasks`.

```text
1. Client sends JSON and Authorization: Bearer <access token>
2. Express receives the request in the Node.js process
3. Helmet, CORS, body parsing, metrics, and API rate limiting run
4. tasks router matches the project-scoped POST route
5. authenticate verifies the JWT signature and places sub/email/role on req.user
6. authorizeProjectRole checks project membership and requires OWNER or ADMIN
7. TaskController.create runs createTaskSchema.safeParse on req.body
8. Invalid input becomes AppError(400) and reaches errorHandler
9. Valid input goes to TaskService.createTask
10. TaskService confirms project membership and trims accepted fields
11. PrismaTaskRepository.create calls Prisma Client
12. Prisma Client writes a Task row to PostgreSQL
13. ActivityLogService records a TASK CREATED event
14. CacheService deletes tasks:project:<projectId>
15. Controller returns { success: true, data: task } with HTTP 201
16. metricsMiddleware records duration and status
17. Pino logs failures or lifecycle events when applicable
18. Prometheus later scrapes the aggregate metrics, and Grafana visualizes them
```

Failure boundaries are deliberate: invalid input is 400, missing or invalid identity is 401, insufficient membership/role is 403, missing resources are 404, rate limits are 429, and unexpected failures are logged and returned as 500.

## Interview Summary

A concise, accurate project explanation is:

> "TeamFlow is a TypeScript Node.js modular monolith using Express for a versioned REST API. Requests pass through security, JWT authentication, role authorization, and Zod validation before thin controllers call services. Services apply collaboration rules and use repository interfaces backed by Prisma and PostgreSQL. Redis provides fail-open cache-aside reads for tasks. Docker Compose runs the API, PostgreSQL, Redis, Prometheus, and Grafana locally. Pino handles structured logs, and GitHub Actions runs Prisma generation, lint, build, and Vitest. NGINX, Kubernetes, Terraform, and AWS deployment are future work, not current implementation."
