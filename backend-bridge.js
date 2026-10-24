/* Shared backend bridge for the website and PC app. */
(() => {
  const API_BASE = (
    window.MEDICAL_STORE_API_BASE ||
    window.location.origin
  ).replace(/\/+$/, '');

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

  function apiUrl(path = '') {
    return `${API_BASE}/api/state${path}`;
  }

  function queueWrite(task) {
    writeQueue = writeQueue.then(task).catch(error => {
      console.error('Shared database save failed:', error);

      window.dispatchEvent(
        new CustomEvent('medical-store-backend-error', {
          detail: error
        })
      );
    });

    return writeQueue;
  }

  async function loadApp() {
    try {
      const response = await fetch(apiUrl(), {
        headers: {
          Accept: 'application/json'
        }
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
          const value =
            typeof state[key] === 'string'
              ? state[key]
              : JSON.stringify(state[key]);

          native.setItem.call(localStorage, key, value);
        } else {
          native.removeItem.call(localStorage, key);
        }
      }

      backendOnline = true;
      document.documentElement.dataset.backendStatus = 'online';

    } catch (error) {
      console.error('Shared database connection failed:', error);

      document.documentElement.dataset.backendStatus = 'offline';
    }

    RESET_FLAGS.forEach(key => {
      native.setItem.call(localStorage, key, '1');
    });

    Storage.prototype.setItem = function(key, value) {
      native.setItem.call(this, key, value);

      if (
        this !== localStorage ||
        !backendOnline ||
        !DATA_KEYS.has(String(key))
      ) {
        return;
      }

      const serialized = String(value);

      queueWrite(async () => {
        const response = await fetch(
          apiUrl(`/${encodeURIComponent(key)}`),
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              value: serialized
            })
          }
        );

        if (!response.ok) {
          throw new Error(
            `Save failed for ${key}: HTTP ${response.status}`
          );
        }
      });
    };

    Storage.prototype.removeItem = function(key) {
      native.removeItem.call(this, key);

      if (
        this !== localStorage ||
        !backendOnline ||
        !DATA_KEYS.has(String(key))
      ) {
        return;
      }

      queueWrite(async () => {
        const response = await fetch(
          apiUrl(`/${encodeURIComponent(key)}`),
          {
            method: 'DELETE'
          }
        );

        if (!response.ok) {
          throw new Error(
            `Delete failed for ${key}: HTTP ${response.status}`
          );
        }
      });
    };

    const app = document.createElement('script');
    app.src = 'script.js';

    app.onload = () => {
      if (!backendOnline) {
        console.warn(
          'Shared database unavailable. Changes may remain local.'
        );
      }
    };

    app.onerror = () => {
      console.error('Could not load script.js');
    };

    document.body.appendChild(app);
  }

  loadApp();
})();
