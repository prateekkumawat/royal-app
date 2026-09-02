# 🐳 Docker Deployment Guide - Cash Management System (CMS)

This guide provides instructions on how to build, run, and manage the Cash Management System using Docker and Docker Compose.

---

## 🚀 Single Container Service Deployment with Docker Compose

The system is configured to run all microservices (`gateway`, `auth`, `account`, `transaction`, `analytics`, `reconciliation`) inside a single lightweight container using the `start-services.js` orchestrator.

### 1. Build and Start the Container
Run the following command from the project root:

```bash
docker compose up --build -d
```

This will build and start the `cash-management-system` container:
- **API Gateway & Dashboard UI**: `http://localhost:5000`
- **Auth Service**: `http://localhost:5001`
- **Account Service**: `http://localhost:5002`
- **Transaction Engine**: `http://localhost:5003`
- **Analytics Service**: `http://localhost:5004`
- **Reconciliation Service**: `http://localhost:5005`

### 2. Verify Container Health
Check the container status and health check:

```bash
docker compose ps
```

Check the aggregated health endpoint:

```bash
curl http://localhost:5000/health
```

### 3. Access Dashboard UI
Open your browser and navigate to:
👉 **[http://localhost:5000](http://localhost:5000)**

### 4. View Application Logs

```bash
docker compose logs -f
```

### 5. Stop the Service

```bash
docker compose down
```

---

## 📦 Direct Docker Deployment (Without Compose)

### 1. Build the Docker Image

```bash
docker build -t cash-management-system:latest .
```

### 2. Run the Container

```bash
docker run -d \
  --name cash-management-system \
  -p 5000:5000 \
  -p 5001:5001 \
  -p 5002:5002 \
  -p 5003:5003 \
  -p 5004:5004 \
  -p 5005:5005 \
  cash-management-system:latest
```

---

## 🛡️ Port Reference

| Microservice | Port | Route / Endpoint |
|---|---|---|
| API Gateway & Dashboard | 5000 | `/` and `/health` |
| Auth Service | 5001 | `/api/v1/auth` |
| Account Service | 5002 | `/api/v1/accounts` |
| Transaction Engine | 5003 | `/api/v1/transactions` |
| Analytics Service | 5004 | `/api/v1/analytics` |
| Reconciliation Service | 5005 | `/api/v1/reconciliation` |
