# Docker Containerization Guide

This document explains how to run, develop, and deploy the Expense Tracker application using Docker.

## Architecture Overview

The system uses a 3-tier container architecture:

```
[Browser] ─(:80)─> [ Nginx (Frontend) ]
                          │
                          ├─ serves React static assets
                          └─ proxy_pass /api/*
                                  │
                                (:8080)
                                  │
                           [ Spring Boot (Backend) ] ─(:3306)─> [ MySQL 8.0 ]
                                  │                                  │
                          (receipt-uploads)                    (mysql-data)
                                Volume                             Volume
```

## Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Ports `80`, `8080`, and `3306` must be free on your host machine.

---

## 🚀 Quick Start (Production-Like Environment)

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```
2. **Edit `.env`** to include your secure passwords and Gmail SMTP credentials.
3. **Start the application in detached mode:**
   ```bash
   docker-compose up -d
   ```
4. **Access the application:**
   - Frontend: `http://localhost`
   - API Health Check: `http://localhost/api/health`

---

## 🛠️ Development Mode (Hot-Reload)

To develop with local source code while running the infrastructure in Docker:

1. **Start development mode:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```
2. **What this does:**
   - Mounts `./frontend/src` directly into the Node container, running Vite HMR on `http://localhost:5173`.
   - Mounts `./backend/src` and `pom.xml` into the Maven container, running Spring DevTools on `http://localhost:8080`.
   - Caches Maven dependencies in a persistent volume (`maven-cache`).
3. **Access points in Dev Mode:**
   - Frontend (Vite): `http://localhost:5173`
   - Backend API: `http://localhost:8080/api`
   - Database: `localhost:3306` (exposed for local DB tools like DBeaver)

---

## 🔒 Production Deployment

For an actual production server, use the hardened override file:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Production Features:**
- Restart policies (`always`).
- Memory limits applied to containers.
- Backend port `8080` is hidden from the host (accessible only via Nginx).
- JSON-file log rotation to prevent disk space exhaustion.

---

## 💾 Managing Persistent Data

Data is stored in Docker volumes. Even if you destroy the containers, the data remains.

**View existing volumes:**
```bash
docker volume ls
```

**To completely wipe all data (DANGER!):**
```bash
docker-compose down -v
```

**Backing up MySQL:**
```bash
docker exec expense-mysql /usr/bin/mysqldump -u root -p[YOUR_PASSWORD] expense_tracker > backup.sql
```

**Restoring MySQL:**
```bash
cat backup.sql | docker exec -i expense-mysql /usr/bin/mysql -u root -p[YOUR_PASSWORD] expense_tracker
```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | MySQL root user password | *Required* |
| `MYSQL_DATABASE` | Database name | `expense_tracker` |
| `DB_USERNAME` | App DB user | `root` |
| `DB_PASSWORD` | App DB password | *Required* |
| `SPRING_PROFILES_ACTIVE`| Spring profile (`dev` or `prod`) | `prod` |
| `JWT_SECRET` | 256-bit+ secure key for JWT | *Required* |
| `MAIL_USERNAME` | Sender email address | *Required* |
| `MAIL_PASSWORD` | Sender email app password | *Required* |
| `FRONTEND_PORT` | Host port mapped to Nginx | `80` |
| `BACKEND_PORT` | Host port mapped to Spring | `8080` |
| `MYSQL_PORT` | Host port mapped to MySQL | `3306` |
| `FRONTEND_URL` | URL used for CORS and Email Links | `http://localhost` |
