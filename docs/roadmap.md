# Roadmap

## Completed sprints

- Sprint 5.1 — CI/CD
- Sprint 5.2 — Security Hardening
- Sprint 5.3 — Docker Compose
- Sprint 5.4 — Redis Caching
- Sprint 5.5 — Monitoring
- Sprint 5.6 — Production Documentation & CI Cleanup

## Current sprint

### Sprint 5.6 — Production Documentation & CI Cleanup

This sprint focuses on bringing the repository, CI pipeline, and production documentation back into alignment with the real codebase.

Completed work for this sprint includes:

- adding lint execution to GitHub Actions
- documenting the active Docker Compose runtime stack
- updating the README technology stack and setup instructions
- correcting false statements about NGINX and cloud deployment
- aligning the deployment guide and roadmap with the actual implementation status

## Future sprints

- Sprint 5.7 — NGINX Reverse Proxy
- Sprint 5.8 — AWS Deployment

AWS deployment remains dependent on resolving account access and cloud environment readiness.

## Deferred ideas

- Attachments and file storage
- Real-time updates through WebSockets or server-sent events
- Email, push, or real-time notification delivery
- Mentions and mention parsing
- A frontend client

These remain intentionally deferred until the core service is secure, automated, observable, and deployable.
