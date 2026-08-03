COMPOSE ?= docker compose --env-file backend/.env

.PHONY: up down logs build test reset-db

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

build:
	$(COMPOSE) build

test:
	cd backend && npm test

reset-db:
	$(COMPOSE) down -v
