/* Shared backend bridge for the website and PC app. */
(() => {
  const API_BASE = (
    window.MEDICAL_STORE_API_BASE ||
    window.location.origin
  ).replace(/\/+$/, '');

  // Never synchronize passwords or login sessions.
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

  let backendOnline = false;
  let writeQueue = Promise.resolve();

  function apiUrl(path = '') {
    return `${API_BASE}/api/state${path}`;
  }

  function saveToServer(key, value) {
    writeQueue = writeQueue.then(async () => {
      const response = await fetch(
        apiUrl(`/${encodeURIComponent(key)}`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value })
        }
      );

      if (!response.ok) {
        throw new Error(`Save failed for ${key}: HTTP ${response.status}`);
      }
    }).catch(error => {
      console.error('Shared database save failed:', error);
      document.documentElement.dataset.backendStatus = 'error';
    });

    return writeQueue;
  }

  async function loadApp() {
    try {
      const response = await fetch(apiUrl(), {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const state = await response.json();

      for (const key of DATA_KEYS) {
        if (
          Object.prototype.hasOwnProperty.call(state, key) &&
          state[key] !== null &&
          state[key] !== undefined
        ) {
          const value = typeof state[key] === 'string'
            ? state[key]
            : JSON.stringify(state[key]);

          native.setItem.call(localStorage, key, value);
        } else {
          // Preserve existing local data if the server has no record.
          const localValue = native.getItem.call(localStorage, key);

          if (localValue !== null) {
            await saveToServer(key, localValue);
          }
        }
      }

      backendOnline = true;
      document.documentElement.dataset.backendStatus = 'online';

    } catch (error) {
      console.error('Shared database connection failed:', error);
      document.documentElement.dataset.backendStatus = 'offline';
    }

    Storage.prototype.setItem = function(key, value) {
      native.setItem.call(this, key, value);

      if (
        this === localStorage &&
        backendOnline &&
        DATA_KEYS.has(String(key))
      ) {
        saveToServer(String(key), String(value));
      }
    };

    Storage.prototype.removeItem = function(key) {
      native.removeItem.call(this, key);

      if (
        this === localStorage &&
        backendOnline &&
        DATA_KEYS.has(String(key))
      ) {
        writeQueue = writeQueue.then(async () => {
          const response = await fetch(
            apiUrl(`/${encodeURIComponent(key)}`),
            { method: 'DELETE' }
          );

          if (!response.ok) {
            throw new Error(`Delete failed: HTTP ${response.status}`);
          }
        }).catch(error => {
          console.error('Shared database delete failed:', error);
        });
      }
    };

    const app = document.createElement('script');
    app.src = 'script.js';
    app.onerror = () => console.error('Could not load script.js');
    document.body.appendChild(app);
  }

  loadApp();
})();
