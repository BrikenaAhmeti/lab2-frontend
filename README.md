# MedSphere Frontend

React + TypeScript + Vite frontend for the Lab2 MedSphere platform. It serves the public website, authentication screens, and role-based portals for admins, doctors, nurses, receptionists, lab staff, pharmacy staff, and patients.

The frontend does not own a database. It talks to the Lab2 backend services through HTTP and Socket.IO.

## Port

- Local Vite dev server: `http://localhost:3001`
- Docker host port: `http://localhost:3001`
- Docker container port: `80`
- Docker health check path: `/health`

## Environment Keys

Copy `.env.example` to `.env`. Vite reads these keys at build time, so rebuild the Docker image after changing them.

Preferred keys:

- `VITE_AUTH_API_URL`
- `VITE_CORE_API_URL`
- `VITE_NOTIFICATION_API_URL`
- `VITE_NOTIFICATION_SOCKET_URL`
- `VITE_CMS_API_URL`
- `VITE_CMS_SOCKET_URL`
- `VITE_AI_API_URL`
- `VITE_AI_SOCKET_URL`
- `VITE_API_DEVICE_INFO`
- `VITE_VAPI_PUBLIC_KEY`
- `VITE_VAPI_ASSISTANT_ID`

Accepted legacy aliases still supported by `src/config/env.ts`:

- `VITE_API_AUTH_SERVICE`
- `VITE_API_CORE_SERVICE`
- `VITE_API_NOTIFICATION_SERVICE`
- `VITE_API_CMS_SERVICE`
- `VITE_API_AI_SERVICE`
- `VITE_API_CORE`

Docker-only host port override:

- `FRONTEND_PORT`

## Start Locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3001`.

## Run With Docker

```bash
cp .env.example .env
npm run docker:up
npm run docker:logs
```

Stop the container:

```bash
npm run docker:down
```

The Docker image builds the Vite app and serves static files with Nginx. SPA routes fall back to `index.html`.

## Build And Tests

```bash
npm run build
npm run test
```

Additional test modes:

```bash
npm run test:watch
npm run test:ui
```

## Swagger

This repository does not expose Swagger because it is a browser frontend, not an API service. Use the backend service Swagger URLs:

- Auth: `http://localhost:3005/docs` or `http://localhost:3005/api/docs`
- Core: `http://localhost:3007/api/docs`
- Notifications: `http://localhost:3008/api/docs`
- CMS: `http://localhost:3009/api/docs`
- AI: `http://localhost:3010/api/docs`

## Notes

- The app uses React Query, Redux Toolkit, React Router, Socket.IO client, Tailwind, and Vitest.
- Notification and chat realtime features require the Notification Service Socket.IO URL.
- The dashboard AI helper uses `VITE_AI_SOCKET_URL` and sends the authenticated user's current role on every helper message.
- Voice booking requires Vapi keys when that assistant is enabled.
- The latest bundle optimization pass lazy-loads auth pages, portal layouts, heavy widgets, report charts, CMS preview/editor panels, and consultation audio tools.
