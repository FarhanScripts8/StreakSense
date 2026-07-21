# AI Habit Tracker

Full-stack habit tracking application with AI-powered insights (Google Gemini), streak tracking, weekly reports, and analytics dashboards.

## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, Recharts, Axios |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB (Atlas or local) |
| AI | Google Gemini via `@google/genai` |

```
AIHABITTRACKER/
├── Backend/          # Express REST API (port 8000)
└── Frontend/
    └── ai-habit-tracker-ui-boilerplate-code/   # React SPA (port 5173)
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas connection string)

## Quick Start

### 1. Backend

```bash
cd Backend
cp .env.example .env
# Edit .env — set JWT_SECRET and MONGO_URI (or use MONGO_URI_LOCAL)
npm install
npm run dev
```

Server runs at **http://localhost:8000**

Optional demo data:

```bash
npm run seed
# Login: demo@aihabittracker.com / demo123456
```

### 2. Frontend

```bash
cd Frontend/ai-habit-tracker-ui-boilerplate-code
cp .env.example .env
npm install
npm run dev
```

App runs at **http://localhost:5173**

## Environment Variables

### Backend (`Backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 8000) |
| `MONGO_URI` | Yes* | MongoDB Atlas connection string |
| `MONGO_URI_LOCAL` | Yes* | Local MongoDB fallback |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (32+ chars) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 30d) |
| `GEMINI_API_KEY` | No | Google Gemini API key for AI features |
| `GEMINI_MODEL` | No | Model name (default: gemini-3.5-flash) |
| `CLIENT_URL` | No | Allowed CORS origin(s), comma-separated |

\* At least one of `MONGO_URI` or `MONGO_URI_LOCAL` must be reachable.

### Frontend (`Frontend/.../.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API base URL (default: http://localhost:8000/api) |

## API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user (auth)
- `PUT /api/auth/profile` — Update profile (auth)

### Habits (auth)
- `GET /api/habits` — List habits (`?includeArchived=true`)
- `POST /api/habits` — Create habit
- `PUT /api/habits/:id` — Update habit
- `DELETE /api/habits/:id` — Delete habit
- `PUT /api/habits/:id/archive` — Toggle archive
- `PUT /api/habits/reorder` — Reorder habits

### Logs (auth)
- `POST /api/logs` — Mark habit complete
- `DELETE /api/logs` — Unmark complete
- `GET /api/logs/today` — Today's completions
- `GET /api/logs/range?start=&end=` — Date range logs
- `GET /api/logs/heatmap` — 90-day heatmap
- `GET /api/logs/stats` — 30-day stats
- `GET /api/logs/stats/:habitId` — Single habit stats

### AI (auth, requires `GEMINI_API_KEY` for real responses)
- `POST /api/ai/weekly-report` — Weekly AI report
- `POST /api/ai/suggest-habits` — Habit suggestions
- `POST /api/ai/recovery-plan/:habitId` — Streak recovery plan
- `POST /api/ai/chat` — Chat analysis
- `GET /api/ai/morning-motivation` — Morning message

### Health
- `GET /api/health` — Server health check

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| Backend | `npm start` | Production server |
| Backend | `npm run dev` | Dev server with nodemon |
| Backend | `npm run seed` | Seed demo user & habits |
| Frontend | `npm run dev` | Vite dev server |
| Frontend | `npm run build` | Production build |
| Frontend | `npm run lint` | ESLint |
| Frontend | `npm run preview` | Preview production build |

## Deployment Notes

1. Set all backend env vars on your host (never commit `.env`).
2. Build frontend: `npm run build` → serve `dist/` via static host or CDN.
3. Set `VITE_API_URL` to your deployed API URL before building.
4. Set `CLIENT_URL` on the backend to your frontend URL for CORS.

## License

MIT
