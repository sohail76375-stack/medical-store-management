/* Shared API bridge. The server is the source of truth; never silently use local-only data. */
(() => {
  const DATA_KEYS = new Set([
    'districtMedicineHospitals',
    'districtMedicineMedicines',
    'districtMedicineOutflows'
  ]);
  const native = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem
  };
  let enabled = false;
  let writeQueue = Promise.resolve();
  const apiBase = (window.MEDICAL_STORE_API_BASE || '').replace(/\/+$/, '');

  function token() { return native.getItem.call(localStorage, 'medicalStoreToken'); }
  function apiUrl(path) { return apiBase ? `${apiBase}${path}` : path; }
  async function request(path, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    const currentToken = token();
    if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const response = await fetch(apiUrl(path), { ...options, headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
    return body;
  }
  function queueWrite(task) {
    writeQueue = writeQueue.then(task).catch(error => {
      console.error('Shared save failed:', error);
      window.dispatchEvent(new CustomEvent('medical-store-backend-error', { detail: error }));
    });
    return writeQueue;
  }
  async function hydrate() {
    const state = await request('/api/state');
    for (const key of DATA_KEYS) {
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        native.setItem.call(localStorage, key, typeof state[key] === 'string' ? state[key] : JSON.stringify(state[key]));
      } else {
        native.setItem.call(localStorage, key, '[]');
      }
    }
    enabled = true;
    return true;
  }
  Storage.prototype.setItem = function(key, value) {
    native.setItem.call(this, key, value);
    if (this === localStorage && enabled && DATA_KEYS.has(String(key))) {
      const serialized = String(value);
      queueWrite(() => request(`/api/state/${encodeURIComponent(key)}`, {
        method: 'PUT', body: JSON.stringify({ value: serialized })
      }));
    }
  };
  Storage.prototype.removeItem = function(key) {
    native.removeItem.call(this, key);
    if (this === localStorage && enabled && DATA_KEYS.has(String(key))) {
      queueWrite(() => request(`/api/state/${encodeURIComponent(key)}`, { method: 'DELETE' }));
    }
  };
  window.medicalStoreApi = {
    request, hydrate,
    setEnabled(value) { enabled = Boolean(value); },
    get enabled() { return enabled; }
  };
  // Refresh the shared snapshot periodically after login so updates made by another
  // authorized client become visible without copying data between devices.
  window.setInterval(async () => {
    if (!enabled || !token()) return;
    try { await hydrate(); }
    catch (error) {
      console.error('Shared data refresh failed:', error);
      window.dispatchEvent(new CustomEvent('medical-store-backend-error', { detail: error }));
    }
  }, 20000);

  // The UI is loaded immediately, but shared records are only loaded after successful login.
  const app = document.createElement('script');
  app.src = 'script.js';
  app.onload = async () => {
    try {
      const response = await fetch(apiUrl('/api/health'), { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Backend health check failed.');
      document.documentElement.dataset.backendStatus = 'online';
    } catch (error) {
      document.documentElement.dataset.backendStatus = 'offline';
      console.error('Shared backend unavailable:', error);
    }
  };
  document.body.appendChild(app);
})();
