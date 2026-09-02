# Dockerized E-Commerce Microservices & React SPA Platform

A modern, full-stack microservices e-commerce application built with Node.js, Express, MySQL, JWT Authentication, and a modern React SPA frontend, fully containerized with Docker and Docker Compose.

---

## 🏗️ Microservices Architecture

```
                       ┌─────────────────────────┐
                       │   Client Browser        │
                       └───────────┬─────────────┘
                                   │
                                   ▼
                       ┌─────────────────────────┐
                       │  Nginx Gateway (8080)   │
                       └─┬─────────┬───────────┬─┘
                         │         │           │
          /api/auth/*    │         │ /api/products/*
                         ▼         │           ▼
           ┌───────────────┐       │   ┌────────────────┐
           │ Auth Service  │       │   │Product Service │
           │   (Port 5001) │       │   │  (Port 5002)   │
           └───────┬───────┘       │   └───────┬────────┘
                   │               │           │
                   │  /api/orders/*│           │
                   │               ▼           │
                   │      ┌────────────────┐   │
                   │      │ Order Service  │   │
                   │      │  (Port 5003)   │   │
                   │      └───────┬────────┘   │
                   │              │            │
                   ▼              ▼            ▼
           ┌────────────────────────────────────────┐
           │          MySQL Database (3006)         │
           │  (auth_db, catalog_db, order_db)       │
           └────────────────────────────────────────┘
```

---

## ⚡ Quick Start with Docker

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 2. Build and Launch Containers
Run the following command from the root directory:

```bash
docker-compose up --build
```

### 3. Access the Application
Open your browser and navigate to:
👉 **`http://localhost:8080`**

---

## 🔑 Pre-Configured Test Accounts

The MySQL initialization script automatically seeds test accounts for quick testing:

| User Type | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Customer** | `alex@example.com` | `user123` | `customer` |
| **Admin** | `admin@ecommerce.com` | `admin123` | `admin` |

*(You can also register a brand new account using the built-in Registration form!)*

---

## 🛠️ Microservices Overview

### 1. Auth Service (`:5001`)
- **Database**: MySQL `auth_db`
- **Endpoints**:
  - `POST /api/auth/register` - Creates user & hashes password with `bcryptjs`.
  - `POST /api/auth/login` - Validates credentials & signs a JWT token.
  - `GET /api/auth/me` - Verifies token & returns current user details.

### 2. Product Catalog Service (`:5002`)
- **Database**: MySQL `catalog_db`
- **Endpoints**:
  - `GET /api/categories` - Returns product categories.
  - `GET /api/products` - Returns product catalog with search, category filtering, and sorting (`price_asc`, `price_desc`, `rating_desc`).
  - `GET /api/products/:id` - Product details.
  - `POST /api/products` - Admin protected endpoint to create new items.

### 3. Order Service (`:5003`)
- **Database**: MySQL `order_db`
- **Endpoints**:
  - `POST /api/orders` - Requires JWT token. Creates orders and line items using database transactions.
  - `GET /api/orders` - Requires JWT token. Retrieves user order history.

### 4. API Gateway & React Frontend (`:8080`)
- Serves the built React SPA frontend.
- Proxies `/api/*` traffic seamlessly to backend microservices.

---

## 🧪 Local Non-Docker Development (Optional)

If you wish to test services individually without Docker:

```bash
# Install frontend dependencies
cd frontend
npm install
npm run dev

# Install backend dependencies
cd backend/auth-service && npm install && npm start
cd backend/product-service && npm install && npm start
cd backend/order-service && npm install && npm start
```
