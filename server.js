const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.MEDICAL_STORE_HOST || '0.0.0.0';
const DATA_DIR = process.env.MEDICAL_STORE_DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'medical-store.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const ALLOWED_KEYS = new Set([
  'districtMedicineUsers',
  'districtLoggedInUser',
  'districtMedicineHospitals',
  'districtMedicineMedicines',
  'districtMedicineOutflows'
]);
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'medical-store-backend' }));

app.get('/api/state', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM app_state').all();
  const state = {};
  for (const row of rows) if (ALLOWED_KEYS.has(row.key)) state[row.key] = row.value;
  res.json(state);
});

app.put('/api/state/:key', (req, res) => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ error: 'Unsupported data key.' });
  if (typeof req.body?.value !== 'string') return res.status(400).json({ error: 'value must be a serialized string.' });
  // Validate JSON before storing it.
  try { JSON.parse(req.body.value); } catch { return res.status(400).json({ error: 'value must contain valid JSON.' }); }
  db.prepare(`INSERT INTO app_state(key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')`).run(key, req.body.value);
  res.json({ ok: true, key });
});

app.delete('/api/state/:key', (req, res) => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ error: 'Unsupported data key.' });
  db.prepare('DELETE FROM app_state WHERE key = ?').run(key);
  res.json({ ok: true, key });
});

app.use(express.static(__dirname, { extensions: ['html'] }));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error.' });
});

const server = app.listen(PORT, HOST, () => {
  const actualPort = server.address().port;
  console.log(`Medical Store backend running at http://localhost:${actualPort}`);
  console.log('SQLite database:', path.join(DATA_DIR, 'medical-store.sqlite'));
});
function shutdown() { server.close(() => { db.close(); process.exit(0); }); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { app, server, db };
