# Pathora

Pathora is a clean MERN learning platform with a React + Vite frontend, Tailwind CSS, an Express backend, MongoDB through Mongoose, JWT authentication support, and `admin` / `student` roles.

## Project Structure

```text
Pathora/
  client/   React + Vite + Tailwind CSS
  server/   Node.js + Express + MongoDB + JWT
```

## Prerequisites

- Node.js 18+
- npm
- MongoDB running locally or a MongoDB Atlas connection string

## Setup

1. Install dependencies:

   ```bash
   npm run install:all
   ```

2. Create environment files:

   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

3. Update `server/.env` with your MongoDB URI and JWT secret.

   The Python compiler runs fully in the browser with Pyodide. No Judge0 API URL, host, or API key is required.

4. Start both servers:

   ```bash
   npm run dev
   ```

## Development URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## Available Scripts

- `npm run dev` starts the frontend and backend together.
- `npm run dev:client` starts only the frontend.
- `npm run dev:server` starts only the backend.
- `npm run install:all` installs root, client, and server dependencies.
- `npm run seed:admin --prefix server` creates or updates the private admin account from `SEED_ADMIN_*` env vars.

## Admin Account

Public registration always creates student accounts. Create the admin account privately from the backend environment:

```bash
cd server
SEED_ADMIN_NAME="" \
SEED_ADMIN_EMAIL="" \
SEED_ADMIN_PASSWORD="use_a_long_secure_password" \
npm run seed:admin
```

On Render, set `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` temporarily, open the backend shell/job, run `npm run seed:admin`, then remove the password env value after the admin is created.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Render, Vercel, Netlify, MongoDB Atlas, and production environment variable steps.

## Python Compiler

Pathora uses Monaco Editor for editing Python and Pyodide for browser-based execution. Code runs in the user’s browser, captures `print()` output, supports simple `input()` programs through stdin, and checks coding challenge test cases by comparing trimmed stdout with expected output.

The Node backend does not execute Python code.
