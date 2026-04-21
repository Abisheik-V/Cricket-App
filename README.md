# 🏏 Cricket Live Score App

A production-ready full-stack Cricket Scoring Web Application built with React.js, Node.js, MongoDB, and Socket.IO.

## Features

- **Live Scoring Engine** — Ball-by-ball scoring with runs, extras, wickets
- **Keyboard Shortcuts** — `D` dot, `1-6` runs, `W` wicket, `X` wide, `N` no-ball
- **Real-time Updates** — Socket.IO for live spectator view
- **Player Statistics** — Batting/bowling stats, strike rates, economy
- **Match History** — MongoDB-backed match storage, search, and scorecard
- **PDF Export** — jsPDF scorecard export
- **Offline Support** — LocalStorage sync when offline
- **PWA Ready** — Installable as a native app
- **Dark Mode** — Professional cricket-themed dark UI
- **Mobile-First** — Thumb-friendly scoring buttons

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| Styling | Tailwind CSS + Framer Motion |
| State | Redux Toolkit |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT |
| Realtime | Socket.IO |
| PDF | jsPDF |

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas URI or local MongoDB

### 1. Clone & Install

```bash
git clone https://github.com/your-username/cricket-live-score.git
cd cricket-live-score
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 3. Run Backend

```bash
cd server
npm install
npm run server
```

### 4. Run Frontend

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
cricket-app/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── scoring/       # Live scoring panel
│   │   │   ├── setup/         # Match setup wizard
│   │   │   ├── scorecard/     # Scorecard views
│   │   │   ├── history/       # Match history
│   │   │   └── ui/            # Shared UI components
│   │   ├── pages/             # Route pages
│   │   ├── redux/slices/      # Redux state slices
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Helpers (PDF, cricket logic)
├── server/                    # Express backend
│   ├── controllers/           # Route handlers
│   ├── routes/                # API routes
│   ├── models/                # Mongoose schemas
│   ├── middleware/            # Auth, validation, rate limit
│   └── sockets/               # Socket.IO handlers
├── .env.example
└── README.md
```

## API Endpoints

### Teams
- `POST /api/teams` — Create team
- `GET /api/teams` — List all teams

### Matches
- `POST /api/matches/start` — Start new match
- `POST /api/matches/score` — Record ball
- `POST /api/matches/undo` — Undo last ball
- `PATCH /api/matches/edit/:id` — Edit over score
- `GET /api/matches/history` — Match history
- `GET /api/matches/:id` — Single match
- `DELETE /api/matches/:id` — Delete match

### Auth
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `D` | Dot ball |
| `1` | Single |
| `2` | Double |
| `3` | Triple |
| `4` | Four |
| `6` | Six |
| `W` | Wicket (Bowled) |
| `X` | Wide |
| `N` | No Ball |

## Deployment

### Frontend → Vercel/Netlify
```bash
cd client && npm run build
# Deploy /dist folder
```

### Backend → Render/Railway
```bash
# Set environment variables in Render dashboard
# Connect GitHub repo, auto-deploy on push
```

## License
MIT
