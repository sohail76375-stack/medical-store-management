const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.MEDICAL_STORE_HOST || '0.0.0.0';
const DATA_DIR = process.env.MEDICAL_STORE_DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'medical-store-data.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

// Use a plain JSON data file instead of a native SQLite addon. This avoids
// node-gyp/Python/C++ build requirements on Windows while keeping persistent data.
let state = {};
try {
  if (fs.existsSync(DATA_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) state = parsed;
  }
} catch (error) {
  console.error('Could not read saved data file:', error.message);
  throw new Error(`Saved data file is invalid: ${DATA_FILE}. Back it up and repair or remove it before restarting.`);
}
const ALLOWED_KEYS = new Set([
  'districtMedicineUsers',
  'districtLoggedInUser',
  'districtMedicineHospitals',
  'districtMedicineMedicines',
  'districtMedicineOutflows'
]);
function persist() {
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(temp, DATA_FILE);
}
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
// Required for the Android WebView (file:// origin) and separately hosted frontend.
// For production, replace wildcard CORS with your known website origins.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'medical-store-backend' }));
app.get('/api/state', (req, res) => {
  const result = {};
  for (const key of ALLOWED_KEYS) if (typeof state[key] === 'string') result[key] = state[key];
  res.json(result);
});
app.put('/api/state/:key', (req, res) => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ error: 'Unsupported data key.' });
  if (typeof req.body?.value !== 'string') return res.status(400).json({ error: 'value must be a serialized string.' });
  try { JSON.parse(req.body.value); } catch { return res.status(400).json({ error: 'value must contain valid JSON.' }); }
  state[key] = req.body.value;
  try { persist(); } catch (error) {
    console.error('Could not save data:', error);
    return res.status(500).json({ error: 'Could not save data to disk.' });
  }
  res.json({ ok: true, key });
});
app.delete('/api/state/:key', (req, res) => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ error: 'Unsupported data key.' });
  delete state[key];
  try { persist(); } catch (error) {
    console.error('Could not save data:', error);
    return res.status(500).json({ error: 'Could not save data to disk.' });
  }
  res.json({ ok: true, key });
});
app.use(express.static(__dirname, { extensions: ['html'] }));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error.' });
});
const server = app.listen(PORT, HOST, () => {
  console.log(`Medical Store backend running at http://${HOST}:${server.address().port}`);
  console.log('Persistent data file:', DATA_FILE);
  console.log('WARNING: configure HTTPS hosting, persistent disk, access control, and backups before storing real patient/business data.');
});
function shutdown() { server.close(() => process.exit(0)); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
module.exports = { app, server };
