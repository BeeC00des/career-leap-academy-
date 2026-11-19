import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required');
  process.env.JWT_SECRET = 'dev-only-insecure-secret';
  console.warn('[auth] JWT_SECRET not set — using an insecure development secret');
}

const app = express();
// Number of proxies in front of the app, so req.ip (used by the rate limiter) is the real client.
// Vercel rewrite -> Render's load balancer = 2 hops in production.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.use(helmet());
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(dist, 'index.html'))) {
  // Single-host deploy: serve the built React app from the same origin.
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else if (process.env.NODE_ENV === 'production') {
  // API-only deploy (Render) — the React app is hosted on Vercel.
  app.get('*', (_req, res) => res.status(404).json({ message: 'Not found' }));
} else {
  // In development the React app runs on Vite (:5173) — send browsers there.
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  app.get('*', (req, res) => res.redirect(`${clientUrl}${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.code === 11000) return res.status(409).json({ message: 'An account with this email already exists' });
  res.status(err.status || 500).json({ message: 'Something went wrong' });
});

const PORT = Number(process.env.PORT || 5000);
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
    // Render sends SIGTERM on redeploy — finish in-flight requests, then close the DB.
    process.on('SIGTERM', () => server.close(() => disconnectDB().finally(() => process.exit(0))));
  })
  .catch((err) => { console.error(err); process.exit(1); });
