/* Backend persistence bridge for the existing frontend.
   It hydrates the existing app data from SQLite before script.js starts,
   then mirrors changes to the backend while preserving synchronous UI behavior. */
(() => {
  const DATA_KEYS = new Set([
    'districtMedicineUsers',
    'districtLoggedInUser',
    'districtMedicineHospitals',
    'districtMedicineMedicines',
    'districtMedicineOutflows'
  ]);
  const RESET_FLAGS = [
    'medicalStoreFullDataResetV1',
    'hospitalDirectoryResetV2',
    'hospitalDirectoryResetV3',
    'medicineHospitalReferenceResetV5'
  ];
  const native = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem
  };
  let writeQueue = Promise.resolve();
  let backendOnline = false;
  const configuredBase = String(window.MEDICAL_STORE_API_BASE || '').trim();
  const API_BASE = configuredBase && !configuredBase.includes('REPLACE-WITH-YOUR-BACKEND')
    ? configuredBase.replace(/\/$/, '') : '';
  const apiUrl = path => `${API_BASE}${path}`;

  function queueWrite(task) {
    writeQueue = writeQueue.then(task).catch(error => {
      console.error('Backend save failed:', error);
      window.dispatchEvent(new CustomEvent('medical-store-backend-error', { detail: error }));
    });
    return writeQueue;
  }

  async function loadApp() {
    try {
      const response = await fetch(apiUrl('/api/state'), { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const state = await response.json();
      for (const key of DATA_KEYS) {
        if (Object.prototype.hasOwnProperty.call(state, key)) native.setItem.call(localStorage, key, state[key]);
        else native.removeItem.call(localStorage, key);
      }
      backendOnline = true;
    } catch (error) {
      console.error('Could not connect to backend. Starting with this browser\'s local data.', error);
      document.documentElement.dataset.backendStatus = 'offline';
    }

    // The project previously contained one-time data-clearing migrations. Mark them
    // complete here so a new browser does not erase the shared SQLite database.
    RESET_FLAGS.forEach(key => native.setItem.call(localStorage, key, '1'));

    Storage.prototype.setItem = function(key, value) {
      native.setItem.call(this, key, value);
      if (this === localStorage && backendOnline && DATA_KEYS.has(String(key))) {
        const serialized = String(value);
        queueWrite(async () => {
          const response = await fetch(apiUrl(`/api/state/${encodeURIComponent(key)}`), {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: serialized })
          });
          if (!response.ok) throw new Error(`Save failed for ${key} (${response.status})`);
        });
      }
    };
    Storage.prototype.removeItem = function(key) {
      native.removeItem.call(this, key);
      if (this === localStorage && backendOnline && DATA_KEYS.has(String(key))) {
        queueWrite(async () => {
          const response = await fetch(apiUrl(`/api/state/${encodeURIComponent(key)}`), { method: 'DELETE' });
          if (!response.ok) throw new Error(`Delete failed for ${key} (${response.status})`);
        });
      }
    };

    const app = document.createElement('script');
    app.src = 'script.js';
    app.onload = () => {
      if (!backendOnline) console.warn('Medical Store is running without backend persistence. Start it with npm start for shared saved data.');
    };
    document.body.appendChild(app);
  }

  loadApp();
})();
