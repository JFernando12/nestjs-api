# NestJS Movies API - Star Wars Integration

A backend application built with NestJS that manages movies with authentication, role-based authorization, and Star Wars API integration.

[![NestJS](https://img.shields.io/badge/NestJS-11.x-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue)](https://www.docker.com/)

## Challenge Overview

Backend API that integrates with the [Star Wars API (SWAPI)](https://www.swapi.tech/) to provide movie management with:
- JWT authentication and role-based authorization (User/Admin)
- CRUD operations for movies
- Automatic synchronization from SWAPI
- Unit and E2E testing

## Star Wars API Integration - Known Issues

**Potential Timeout on Some Platforms**

When syncing multiple films from SWAPI, the process can exceed 30 seconds (Heroku's max timeout). The sync completes successfully in the background, but the HTTP response times out.

### Improvements That Could Be Implemented

**Asynchronous Processing (Recommended)**
- Respond immediately with 202 Accepted
- Process sync in background using NATS or Kafka
- Send email/push notification when complete
- Automatic retry handling and message processing guarantees
- Similar to how Twitch processes videos or American Express generates statements

## Decisions Taken

**Clean Architecture**: Separated application into modules (auth, users, movies, star-wars) with clear layers: controllers (presentation), services (business logic), repositories (data access), and entities (domain).

**Repository Pattern**: Decoupled data access from business logic. Even external APIs (SWAPI) are accessed through repository interfaces.

**TypeORM with PostgreSQL**: Reliable ORM with good TypeScript support. Entities separated from domain models for flexibility.

**JWT Authentication**: Industry-standard token-based auth with Passport.js strategies. Easily extensible for OAuth or other methods.

**Guards and Decorators**: Reusable `AuthGuard` for authentication and `RolesGuard` for authorization. Custom decorators (`@Public()`, `@Roles()`) for clean controller code.

**Docker**: Containerized for consistent development and deployment. Health checks ensure database is ready before app starts.

**NestJS**: Chosen for its dependency injection system and modular architecture that naturally encourages clean code principles.

**TypeScript**: Static typing prevents bugs and improves maintainability.

**Testing**: Jest for unit tests, Supertest for E2E. Mocked external dependencies for reliable tests.

## Features

- [x] User registration (sign-up) and login with JWT
- [x] Role-based access control (User and Admin roles)
- [x] Get list of movies (public)
- [x] Get movie details (authenticated users)
- [x] Create movie (admin only)
- [x] Update movie (admin only)
- [x] Delete movie (admin only)
- [x] Sync movies from Star Wars API (admin only)
- [x] Unit and E2E tests
- [x] Swagger API documentation
- [x] CI/CD with GitHub Actions
- [x] Automated deployment to Render.com

## CI/CD and Deployment

This project uses **GitHub Actions** for continuous integration and **Render.com** for automated deployment.

### CI/CD Pipeline (GitHub Actions)

When you push to the `main` branch, the following automated workflow runs:

1. **Test Job**:
   - Sets up Node.js 20.x
   - Installs dependencies
   - Runs linter (`npm run lint`)
   - Runs unit tests with mocks (`npm run test`)
   - Runs E2E tests with PostgreSQL (`npm run test:e2e`)

2. **Build Job** (only if tests pass):
   - Builds the application (`npm run build`)
   - Uploads build artifacts

3. **Docker Build Job** (only if tests pass):
   - Builds the Docker image
   - Validates the containerization

### Deployment to Render

The application is deployed on [Render.com](https://render.com) with intelligent deployment:

- **Automatic deployments** from the `main` branch
- **Render waits for GitHub Actions to complete** before deploying
- **Deployment only happens if all CI/CD checks pass**
- If tests fail in GitHub Actions, Render blocks the deployment
- PostgreSQL database instance included
- Zero-downtime deployments
- HTTPS enabled by default

**This ensures that only tested and verified code reaches production.**

### Live Production API

**Swagger Documentation**: https://nestjs-api-ci0z.onrender.com/api

You can test all endpoints directly from the production Swagger interface.

## Author

**JFernando12**

- GitHub: [@JFernando12](https://github.com/JFernando12)
- Repository: [nestjs-api](https://github.com/JFernando12/nestjs-api)

## Table of Contents

- [Technology](#technology)
- [Routes](#routes)
- [Prerequisites](#prerequisites)
- [Run APP](#run-app)
- [Run Tests](#run-tests)
- [CI/CD and Deployment](#cicd-and-deployment)
- [Things to Improve](#things-to-improve)

## Technology

- **Programming Language**: TypeScript
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT, Passport.js, Bcrypt
- **Testing**: Jest, Supertest
- **Containerization**: Docker, Docker Compose
- **Documentation**: Swagger/OpenAPI
- **CI/CD**: GitHub Actions
- **Deployment**: Render.com

## Routes

API Swagger Documentation: `http://localhost:3000/api`

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/signup` | Register new user | Public |
| POST | `/auth/login` | Login and get JWT token | Public |
| GET | `/auth/profile` | Get current user info | Authenticated |

### Movies

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/movies` | Get paginated movies list | Public |
| GET | `/movies/:id` | Get movie details | User |
| POST | `/movies` | Create new movie | Admin |
| PATCH | `/movies/:id` | Update movie | Admin |
| DELETE | `/movies/:id` | Delete movie | Admin |

### Star Wars Integration

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/star-wars/sync` | Sync films from SWAPI | Admin |

## Prerequisites

- **Node.js 20 or higher** (if running without Docker)
- Docker and Docker Compose installed
- Git (for cloning the repository)
- PowerShell (Windows) or Bash (Linux/Mac)
- No services running on ports 3000 (API) and 5432 (PostgreSQL)

## Run APP

### Using Docker (Recommended)

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x setup.sh
./setup.sh
```

The script will:
1. Copy `.env.example` to `.env` if it doesn't exist
2. Stop and remove existing containers
3. Build and start the application
4. Show logs

**Manual Docker Commands:**
```bash
# Copy environment file
cp .env.example .env

# Start the application
docker compose up -d --build

# View logs
docker compose logs -f

# Stop the application
docker compose down
```

### Using NPM (Without Docker)

1. **Ensure Node.js 20 or higher is installed**
2. Install PostgreSQL locally
3. Create database
4. Install dependencies:
```bash
npm install
```

4. Copy and configure `.env`:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Run the application:
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Access the Application

Once running:
- API: `http://localhost:3000`
- Swagger Docs: `http://localhost:3000/api`

### First Steps

1. **Create an admin user** (via Swagger or cURL):
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123",
    "role": "admin"
  }'
```

2. **Login** to get your JWT token:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123"
  }'
```

3. **Use the token** in Swagger:
   - Click "Authorize" button
   - Enter: `Bearer YOUR_TOKEN`
   - Now you can test admin endpoints

4. **Sync Star Wars movies**:
```bash
curl -X POST http://localhost:3000/star-wars/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Press `Ctrl + C` to stop the app (or `docker compose down`).

## Run Tests

### Unit Tests

Unit tests use mocks for all dependencies (database, external APIs, etc.) and can be run locally without Docker:

```bash
npm test
```

### E2E Tests

**Important:** E2E tests **require Docker** as they need a real PostgreSQL database instance. They cannot be run locally with `npm run test:e2e` unless you have PostgreSQL configured.

**Using Docker (Recommended):**

```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
docker compose -f docker-compose.test.yml down -v
```

This will:
1. Start a PostgreSQL container
2. Run all E2E tests against the real database
3. Clean up containers after tests complete

## Things to Improve

**Performance Monitoring**: Add logging service (Winston/Pino) and metrics dashboard for better observability.

**Caching**: Implement Redis for SWAPI responses and frequently accessed data.

**Additional Features**: Password reset, email verification, refresh tokens, movie search/filtering, user favorites, ratings and reviews.
