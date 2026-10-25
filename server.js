const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.MEDICAL_STORE_HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;
const REGISTRATION_INVITE_CODE = process.env.REGISTRATION_INVITE_CODE;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL. Configure a PostgreSQL connection string before starting.');
  process.exit(1);
}
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('Missing/weak JWT_SECRET. Set a random secret of at least 32 characters.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'self' https: data:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  next();
});

const ALLOWED_KEYS = new Set([
  'districtMedicineHospitals',
  'districtMedicineMedicines',
  'districtMedicineOutflows'
]);

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, expectedHex] = stored.split(':');
  try {
    const actual = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch { return false; }
}
function makeToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id, cnic: user.cnic, name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12
  })).toString('base64url');
  const body = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}
function authenticate(req, res, next) {
  const match = /^Bearer (.+)$/.exec(req.get('authorization') || '');
  if (!match) return res.status(401).json({ error: 'Please log in to continue.' });
  const parts = match[1].split('.');
  if (parts.length !== 3) return res.status(401).json({ error: 'Invalid session. Please log in again.' });
  const body = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(body).digest();
  let supplied;
  try { supplied = Buffer.from(parts[2], 'base64url'); } catch { return res.status(401).json({ error: 'Invalid session.' }); }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'Invalid session.' });
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired');
    req.user = payload;
    next();
  } catch { return res.status(401).json({ error: 'Session expired. Please log in again.' }); }
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'medical-store-backend', database: 'connected' });
  } catch (error) {
    console.error('Health check database failure:', error.message);
    res.status(503).json({ ok: false, service: 'medical-store-backend', database: 'unavailable' });
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    if (!REGISTRATION_INVITE_CODE || typeof req.body?.inviteCode !== 'string' || Buffer.byteLength(req.body.inviteCode) !== Buffer.byteLength(REGISTRATION_INVITE_CODE) || !crypto.timingSafeEqual(Buffer.from(req.body.inviteCode), Buffer.from(REGISTRATION_INVITE_CODE))) return res.status(403).json({ error: 'A valid administrator invite code is required.' });
    const name = String(req.body?.name || '').trim();
    const cnic = String(req.body?.cnic || '').replace(/\D/g, '');
    const password = req.body?.password;
    if (name.length < 2 || name.length > 120) return res.status(400).json({ error: 'Enter a valid name.' });
    if (!/^\d{13}$/.test(cnic)) return res.status(400).json({ error: 'CNIC must contain exactly 13 digits.' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 256) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    const result = await pool.query(
      'INSERT INTO app_users (name, cnic, password_hash) VALUES ($1, $2, $3) RETURNING id, name, cnic',
      [name, cnic, hashPassword(password)]
    );
    const user = result.rows[0];
    res.status(201).json({ ok: true, token: makeToken(user), user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this CNIC already exists.' });
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const cnic = String(req.body?.cnic || '').replace(/\D/g, '');
    const password = req.body?.password;
    if (!/^\d{13}$/.test(cnic) || typeof password !== 'string') return res.status(400).json({ error: 'Enter your 13-digit CNIC and password.' });
    const result = await pool.query('SELECT id, name, cnic, password_hash FROM app_users WHERE cnic = $1', [cnic]);
    const user = result.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Invalid CNIC or password.' });
    res.json({ ok: true, token: makeToken(user), user: { id: user.id, name: user.name, cnic: user.cnic } });
  } catch (error) { next(error); }
});

app.get('/api/auth/me', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, cnic FROM app_users WHERE id = $1', [req.user.sub]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Account no longer exists.' });
    res.json({ user: result.rows[0] });
  } catch (error) { next(error); }
});

app.post('/api/auth/change-password', authenticate, async (req, res, next) => {
  try {
    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 256) {
      return res.status(400).json({ error: 'Enter your current password and a new password of at least 8 characters.' });
    }
    const result = await pool.query('SELECT password_hash FROM app_users WHERE id = $1', [req.user.sub]);
    if (!result.rows[0] || !verifyPassword(currentPassword, result.rows[0].password_hash)) {
      return res.status(401).json({ error: 'Your current password is incorrect.' });
    }
    await pool.query('UPDATE app_users SET password_hash = $1 WHERE id = $2', [hashPassword(newPassword), req.user.sub]);
    res.json({ ok: true, message: 'Password updated. Please sign in again on other devices.' });
  } catch (error) { next(error); }
});

app.get('/api/state', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT key, value FROM app_state');
    const state = {};
    for (const row of result.rows) if (ALLOWED_KEYS.has(row.key)) state[row.key] = row.value;
    res.json(state);
  } catch (error) { next(error); }
});
app.put('/api/state/:key', authenticate, async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ error: 'Unsupported data key.' });
    if (typeof req.body?.value !== 'string') return res.status(400).json({ error: 'value must be a serialized string.' });
    let parsed;
    try { parsed = JSON.parse(req.body.value); } catch { return res.status(400).json({ error: 'value must contain valid JSON.' }); }
    if (!Array.isArray(parsed)) return res.status(400).json({ error: 'This data key must contain a JSON array.' });
    if (req.body.value.length > 1_500_000) return res.status(413).json({ error: 'Data payload is too large.' });
    await pool.query(`INSERT INTO app_state(key, value, updated_at) VALUES ($1, $2, NOW())
      ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`, [key, req.body.value]);
    res.json({ ok: true, key });
  } catch (error) { next(error); }
});
app.delete('/api/state/:key', authenticate, async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ error: 'Unsupported data key.' });
    await pool.query('DELETE FROM app_state WHERE key = $1', [key]);
    res.json({ ok: true, key });
  } catch (error) { next(error); }
});

app.use(express.static(__dirname, { extensions: ['html'] }));
app.use((err, req, res, next) => {
  console.error('Request failed:', err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'The server could not complete the request.' });
});

// Vercel runs this Express application as a serverless function via api/[...route].js.
// For local testing, run `npm start`; the local listener is isolated from the Vercel handler.
if (require.main === module) {
  const server = app.listen(PORT, HOST, () => console.log(`Medical Store backend listening on ${HOST}:${PORT}`));
  async function shutdown() {
    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
module.exports = { app, pool };
