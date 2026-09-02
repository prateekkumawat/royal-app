# Full Stack Spring Boot REST API Architecture

A production-grade, containerized full-stack API architecture featuring a **Spring Boot 3 REST API** (Java 21), **CORS configuration**, **Swagger UI (OpenAPI 3)** documentation, **PostgreSQL persistence**, a modern **React 18 Single Page Application**, and multi-container orchestration via **Docker & Docker Compose**.

---

## 🚀 Key Features & Stack Overview

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Backend API** | Spring Boot 3.2 (Java 21) | RESTful API, Spring Data JPA, Hibernate, Actuator Health |
| **Security / CORS** | WebMvcConfigurer & CorsFilter | Cross-Origin resource sharing configured for React origins |
| **API Documentation** | SpringDoc OpenAPI 3 / Swagger UI | Auto-generated interactive API docs (`/swagger-ui.html`) |
| **Database** | PostgreSQL 16 | Relational store with Docker persistent volume & schema migrations |
| **Frontend UI** | React 18 + Vite | Modern glassmorphism UI, live health monitor, CRUD dashboard |
| **Orchestration** | Docker & Docker Compose | Multi-stage Dockerfiles with automated health check readiness |

---

## 🏛 Architecture Diagram

```
                     ┌──────────────────────────────────────┐
                     │            User Browser              │
                     └──────────────────┬───────────────────┘
                                        │
                                        ▼
                     ┌──────────────────────────────────────┐
                     │         React SPA (Port 3000)        │
                     │       Nginx Web Server / Vite        │
                     └──────────────────┬───────────────────┘
                                        │
                         HTTP REST      │  [CORS Permitted]
                         Requests       ▼
                     ┌──────────────────────────────────────┐
                     │      Spring Boot API (Port 8080)     │
                     │  - CORS Filter (WebMvcConfigurer)    │
                     │  - Task REST Controller (/api/v1)    │
                     │  - OpenAPI / Swagger UI              │
                     └──────────────────┬───────────────────┘
                                        │
                         Spring Data    │  JDBC Connection
                         JPA / ORM      ▼
                     ┌──────────────────────────────────────┐
                     │      PostgreSQL DB (Port 5432)       │
                     │    Volume: pgdata (Persistent)       │
                     └──────────────────────────────────────┘
```

---

## 📡 REST API Endpoints & Swagger UI

Interactive Swagger UI documentation is available at:
👉 **`http://localhost:8080/swagger-ui.html`**

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/tasks` | Get all tasks (supports `search`, `status`, `category` filters) |
| `GET` | `/api/v1/tasks/{id}` | Get task by ID |
| `POST` | `/api/v1/tasks` | Create a new task |
| `PUT` | `/api/v1/tasks/{id}` | Update existing task by ID |
| `DELETE` | `/api/v1/tasks/{id}` | Delete task by ID |
| `GET` | `/api/v1/tasks/stats` | Get aggregate task statistics |
| `GET` | `/api/v1/tasks/categories` | Get distinct task categories |
| `GET` | `/api/v1/health` | System health check & Database ping status |

---

## 🐳 Quick Start with Docker Compose (Recommended)

Run the complete multi-container stack (Database + Backend + Frontend) with a single command:

```bash
docker compose up --build
```

Access the services:
- **React Frontend**: `http://localhost:3000`
- **Spring Boot API**: `http://localhost:8080/api/v1/tasks`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **Health Check**: `http://localhost:8080/api/v1/health`

To stop the containers:
```bash
docker compose down
```

---

## 💻 Local Development Setup (Without Docker)

### 1. Run Backend API
```bash
cd backend
# Run with in-memory H2 database option:
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Or run with local PostgreSQL database:
mvn spring-boot:run
```

### 2. Run React Frontend
```bash
cd frontend
npm install
npm run dev
```
Access frontend at `http://localhost:3000`.

---

## 🛡 CORS Configuration Details

CORS is configured in `backend/src/main/java/com/example/api/config/CorsConfig.java`:
- Allowed origins: `http://localhost:3000`, `http://localhost:5173`, `http://localhost:80`, `http://localhost`
- Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`
- Allowed headers: `*`
- Max age: `3600` seconds (1 hour preflight caching)
