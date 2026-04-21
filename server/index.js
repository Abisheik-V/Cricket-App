const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes  = require('./routes/auth');
const teamRoutes  = require('./routes/teams');
const matchRoutes = require('./routes/matches');

const app    = express();
const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';

// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    // In production, same origin → no CORS needed for socket; keep flexible for dev
    origin: isProd ? '*' : (process.env.CLIENT_URL || 'http://localhost:5173'),
    methods: ['GET', 'POST'],
  },
});
app.set('io', io);

// ── Database ───────────────────────────────────────────────────────────────
connectDB();

// ── Security middleware ─────────────────────────────────────────────────────
app.use(
  helmet({
    // Allow Vite's inline scripts in development, relax CSP in production for the SPA
    contentSecurityPolicy: isProd ? {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'"],
        styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
        imgSrc:      ["'self'", 'data:', 'blob:'],
        connectSrc:  ["'self'", 'wss:', 'ws:'],
      },
    } : false,
  })
);

// ── CORS (API only — frontend is same-origin in production) ─────────────────
if (!isProd) {
  // Dev: frontend runs on :5173, backend on :5000
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }));
} else {
  // Prod: frontend served by this same Express, so no CORS needed for browser.
  // But allow the Render URL in case someone hits the API directly.
  app.use(cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  }));
}

app.use(express.json());
app.use(morgan(isProd ? 'combined' : 'dev'));

// ── Rate limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  message:  { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/teams',   teamRoutes);
app.use('/api/matches', matchRoutes);

app.get('/health', (req, res) =>
  res.json({ status: 'OK', env: process.env.NODE_ENV, timestamp: new Date() })
);

// ── Socket handlers ─────────────────────────────────────────────────────────
require('./sockets/matchSocket')(io);

// ── Serve React SPA in production ───────────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  // All non-API routes serve the SPA index (client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🏏 Cricket Server running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV}`);
  console.log(`   MongoDB     : ${process.env.MONGODB_URI ? '✅ configured' : '❌ MISSING'}`);
  if (isProd) console.log(`   Serving SPA : ${path.join(__dirname, '../client/dist')}`);
});
