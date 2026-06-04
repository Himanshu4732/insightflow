# 🌌 InsightFlow Monorepo

InsightFlow is an intelligent, real-time SaaS analytics platform designed to ingest raw transactional data, analyze column metrics, run natural language SQL database queries, detect timeseries anomalies, and generate ML-based forecasts.

![InsightFlow Showcase Placeholder](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop)

---

## 🛠️ Technology Stack

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFDF00)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=009688)](https://fastapi.tiangolo.com/)
[![Prophet](https://img.shields.io/badge/Prophet-f35d5d?style=for-the-badge&logoColor=white)](https://facebook.github.io/prophet/)

---

## 📡 Architecture Diagram

```mermaid
graph TD
    subgraph Frontend Client
        Web[Vite React Client - Port 3000]
    end

    subgraph Backend Gateways
        API[Express.js Server - Port 4000]
        WS[Socket.io Gateway]
    end

    subgraph Analytics Services
        ML[FastAPI Service - Port 8000]
        Engine[Prophet & IsolationForest Engine]
    end

    subgraph Datastores
        DB[(PostgreSQL 16 - Port 5432)]
        Cache[(Redis 7 - Port 6379)]
    end

    Web -->|HTTP / REST| API
    Web -->|WS Channels| WS
    API -->|Proxies Requests| ML
    ML --> Engine
    API -->|Transactional SQL| DB
    API -->|Caching & PubSub| Cache
```

---

## 🚀 Quick Start (with Docker Compose)

Get the entire production stack running in a single command. 

### 1. Clone & Configure
```bash
git clone https://github.com/insightflow/insightflow.git
cd insightflow
cp .env.example .env
```

### 2. Launch Docker Services
```bash
docker-compose up --build
```
This builds and boots:
* **PostgreSQL 16** (port `5432` with volume persistence)
* **Redis 7-alpine** (port `6379`)
* **Express API** (port `4000`, waits for postgres to pass healthchecks)
* **Python ML API** (port `8000` via Uvicorn)
* **Vite Web Client** (port `3000` serving production preview)

### 3. Seed Mock Dataset
In a separate terminal, seed a realistic 50k row e-commerce sales dataset:
```bash
docker-compose exec api npm run seed
```

---

## ⚙️ Manual Setup (Without Docker)

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)
* PostgreSQL instance running locally (Database name: `insightflow`)
* Redis instance running locally (Port: `6379`)

### 1. Workspace Installation
From the repository root, install JS/TS monorepo workspace dependencies:
```bash
npm install
```

### 2. Run Database Seeding
Create tables and ingest the 2-year transactional data:
```bash
npm run seed
```

### 3. Run Developer Servers
To boot both the Express API and Vite client concurrently in development mode:
```bash
# Launch Express API (Port 4000) & Vite React client (Port 3000)
npm run dev:api
npm run dev:web
```

To run the Python FastAPI ML server (in a separate tab):
```bash
cd apps/ml
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

---

## 🔑 Environment Variables

Create a `.env` in the project root with the following fields:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Node Express API server port | `4000` |
| `NODE_ENV` | Application environment state | `development` |
| `DATABASE_URL` | PostgreSQL pool connection URI | `postgresql://postgres:postgres@localhost:5432/insightflow` |
| `REDIS_URL` | Redis server connection URI | `redis://localhost:6379` |
| `JWT_SECRET` | Secret token used to sign access JWTs | `supersecretchangeinproduction` |
| `REFRESH_TOKEN_SECRET` | Secret token used to sign refresh JWTs | `anotherrefreshsupersecrettoken` |
| `VITE_API_URL` | Backend URL used by React Client | `http://localhost:4000` |
| `VITE_ML_URL` | Python Service URL used by Express API | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID for Google Authentication | `your-google-client-id...` |

---

## 📖 API Endpoint Documentation

### Authentication Routes (`/api/auth`)
* `POST /register`: Registers a new user account, creates an organization workspace, and establishes cookies.
* `POST /login`: Log in via email/password credentials.
* `POST /logout`: Clears authentication tokens and logs the user out.
* `GET /me`: Returns the currently authenticated user's credentials.
* `PUT /profile`: Updates user profile name and Unsplash avatar preset.
* `PUT /password`: Updates user account password (requires current password).

### Workspace Routes (`/api/workspace`)
* `GET /`: Retrieves active workspace metadata and subscription tier.
* `PUT /`: Edits workspace display name and URL slug.
* `DELETE /`: Permanently deletes the active workspace organization (cascades deletion).

### Team Collaboration Routes (`/api/org`)
* `GET /members`: Returns workspace's active team members and pending email invitations.
* `POST /members`: Invites a colleague via email and assigns roles (`Admin`, `Analyst`, `Viewer`).
* `DELETE /members/:id`: Removes a member from the workspace or revokes a pending invitation.

### Dataset Management Routes (`/api/datasets`)
* `GET /`: Lists all active uploaded datasets of the workspace.
* `POST /upload`: Uploads and parses Excel/CSV files, inferring column schemas.
* `GET /:id`: Retrieves schema details for a specific dataset.
* `GET /:id/rows`: Returns paginated, sorted, and filtered database rows.
* `DELETE /:id`: Performs soft-deletion of datasets.

### Dashboard Analysis Routes (`/api/dashboard`)
* `GET /kpis`: Returns live dashboard summary cards.
* `GET /revenue-chart`: Aggregates monthly transactional revenues.
* `GET /top-products`: Calculates category-wise order statistics.

### ML Services Routes (`/api/ml`)
* `POST /forecast`: Returns historical and predicted Prophet future horizons.
* `POST /anomalies`: Detects outliers in numeric arrays using scikit-learn's Isolation Forest.
* `POST /stats`: Calculates descriptive metrics (variance, std, percentiles) and generates histogram bins.

---

## 🗺️ Roadmap

- [ ] **Multi-Workspace Switcher**: Enable single-user accounts to traverse and create separate organizations dynamically.
- [ ] **Linear/Slack Alert Webhooks**: Support third-party messaging integrations directly from the Alerts panel.
- [ ] **Custom AI Agent Visualizers**: Enable natural-language query engine to output interactive Recharts components of any arbitrary structure.
- [ ] **Prophet Tuning controls**: Add forecasting seasonality controls (additive vs multiplicative) inside the client interface.
