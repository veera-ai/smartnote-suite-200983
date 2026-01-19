# SmartNote Frontend (React)

Modern notes UI with Ocean Professional styling (blue + amber accents), responsive layout, and a centralized API client driven by `REACT_APP_*` env vars.

## Features

- Authentication: Sign in / Sign up / Sign out
  - Client-side validation
  - Auth tokens stored **in memory only**
  - Refresh flow via `POST /auth/refresh` when backend supports it
- Layout: Top navbar + collapsible sidebar + main content
- Notes module:
  - Notes list with debounced search
  - Tag filters
  - Create / edit / delete
  - Pinned + Favorite flags
  - Loading / empty / error states
- Editor:
  - Markdown editor (SimpleMDE)
  - Debounced autosave with save indicator
- AI actions:
  - Generate title, Summarize, Expand/Improve
  - Calls `POST /ai/*` endpoints
  - Graceful fallback UI when backend is unavailable
- Local demo mode:
  - If no backend env var is set, notes are stored in browser `localStorage` so the UI remains usable.

## Configuration (env vars)

This app **never hardcodes server URLs**.

- `REACT_APP_API_BASE` (preferred): Base URL for REST API, e.g. `https://api.example.com`
- `REACT_APP_BACKEND_URL` (fallback): Same purpose if `REACT_APP_API_BASE` is not set
- `REACT_APP_WS_URL` (optional): For future websocket features

If neither `REACT_APP_API_BASE` nor `REACT_APP_BACKEND_URL` is set, SmartNote runs in **local demo mode**.

## Expected Backend API (minimal)

### Auth
- `POST /auth/login` → `{ accessToken, refreshToken, user }`
- `POST /auth/register` → `{ accessToken, refreshToken, user }`
- `POST /auth/refresh` → `{ accessToken, refreshToken?, user? }`

### Notes
- `GET /notes`
- `POST /notes`
- `GET /notes/:id`
- `PATCH /notes/:id`
- `DELETE /notes/:id`

### AI
- `POST /ai/title` → `{ title }`
- `POST /ai/summarize` → `{ summary }`
- `POST /ai/expand` → `{ text }`

## Notes on security

- Access/refresh tokens are kept in memory only; a page reload signs the user out.
- This is intentional to keep the frontend safe by default and avoid persistence without a clear backend strategy.
"
