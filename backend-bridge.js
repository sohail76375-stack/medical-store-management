/* Shared backend bridge for website and PC app */
(() => {
  const API_BASE = window.location.origin.replace(/\/+$/, "");
  const DATA_KEYS = [
    "districtMedicineHospitals",
    "districtMedicineMedicines",
    "districtMedicineOutflows"
  ];

  const native = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem
  };

  let backendOnline = false;
  let writeQueue = Promise.resolve();

  function setStatus(status) {
    document.documentElement.dataset.backendStatus = status;
  }

  function saveToServer(key, value) {
    writeQueue = writeQueue.then(async () => {
      const response = await fetch(
        `${API_BASE}/api/state/${encodeURIComponent(key)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value })
        }
      );

      if (!response.ok) {
        throw new Error(`Save ${key} failed: HTTP ${response.status}`);
      }
    });

    writeQueue = writeQueue.catch(error => {
      console.error("Database save failed:", error);
      setStatus("error");
    });

    return writeQueue;
  }

  async function start() {
    try {
      console.log("Connecting to database:", API_BASE);

      const response = await fetch(`${API_BASE}/api/state`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const state = await response.json();

      for (const key of DATA_KEYS) {
        if (
          Object.prototype.hasOwnProperty.call(state, key) &&
          state[key] !== null &&
          state[key] !== undefined
        ) {
          const value = typeof state[key] === "string"
            ? state[key]
            : JSON.stringify(state[key]);

          native.setItem.call(localStorage, key, value);
          console.log(`Loaded ${key} from database`);
        } else {
          console.warn(`No server record found for ${key}`);
        }
      }

      backendOnline = true;
      setStatus("online");
      console.log("Shared database connected successfully.");

    } catch (error) {
      backendOnline = false;
      setStatus("offline");
      console.error("Database connection failed:", error);
    }

    Storage.prototype.setItem = function(key, value) {
      native.setItem.call(this, key, value);

      if (
        this === localStorage &&
        backendOnline &&
        DATA_KEYS.includes(String(key))
      ) {
        saveToServer(String(key), String(value));
      }
    };

    Storage.prototype.removeItem = function(key) {
      native.removeItem.call(this, key);

      if (
        this === localStorage &&
        backendOnline &&
        DATA_KEYS.includes(String(key))
      ) {
        writeQueue = writeQueue.then(async () => {
          const response = await fetch(
            `${API_BASE}/api/state/${encodeURIComponent(key)}`,
            { method: "DELETE" }
          );

          if (!response.ok) {
            throw new Error(`Delete failed: HTTP ${response.status}`);
          }
        }).catch(error => {
          console.error("Database delete failed:", error);
        });
      }
    };

    // Load the existing application after the initial database sync.
    const loadScript = () => {
      if (document.getElementById("medical-store-main-script")) return;

      const app = document.createElement("script");
      app.id = "medical-store-main-script";
      app.src = `${window.location.origin}/script.js`;
      app.onerror = () => console.error("Could not load script.js");
      document.body.appendChild(app);
    };

    if (document.body) {
      loadScript();
    } else {
      document.addEventListener("DOMContentLoaded", loadScript, {
        once: true
      });
    }
  }

  start();
})();
