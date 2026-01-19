# SmartNote Suite

SmartNote is a modern notes application featuring a React frontend with Ocean Professional styling, and a (future/external) backend API for authentication, notes CRUD, and AI actions.

## Containers

- `frontend_web/` — React SPA (this repository includes this container)
  - Uses env vars (`REACT_APP_API_BASE`, `REACT_APP_BACKEND_URL`, `REACT_APP_WS_URL`) for backend connectivity
  - Runs in local demo mode if backend is not configured
