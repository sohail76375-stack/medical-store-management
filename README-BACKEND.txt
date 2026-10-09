# District Quetta Medicine Store Management — Backend Starter

The existing frontend design is preserved. This package adds a Node.js + Express backend and a SQLite database, and connects the existing frontend data keys to the backend.

## Requirements
- Node.js 20 LTS or newer
- Internet access on first setup to download npm packages

## Run on Windows
1. Install Node.js LTS from the official Node.js website if it is not already installed.
2. Extract this ZIP into a normal folder.
3. Open that folder in File Explorer.
4. Click the address bar, type `cmd`, and press Enter.
5. Run these commands, one at a time:

   ```bat
   npm install
   npm start
   ```
6. Keep the Command Prompt window open.
7. Open `http://localhost:3000` in Chrome or Edge. Do not open `index.html` by double-clicking it; use the local server URL.

## What is now saved in the backend
- User records and current signed-in user state
- Hospitals
- Medicines and stock records
- Medicine outflow/distribution records

The backend stores these records in `data/medical-store.sqlite`. Data persists when the browser is closed and reopened, and the same server/database can be used from multiple browser windows on the same machine/network.

## API health check
Open `http://localhost:3000/api/health`. A healthy server returns JSON with `"ok": true`.

## Important limitations before real-world deployment
This is the first backend integration step, not a production-ready security release. The current frontend's registration/login logic still validates accounts in the browser and the current user data structure may contain passwords. Do not expose this server to the public internet or use real sensitive account information yet. The next backend phase should move registration, login, password hashing, password recovery, and role/permission checks to server-side authentication, then replace the generic state endpoints with validated, user-scoped CRUD APIs and backups.

## Existing design
The HTML/CSS design and existing application scripts are retained. `backend-bridge.js` loads the saved app data from SQLite before the existing `script.js` starts and mirrors data changes to the backend. If the server is not started, the frontend may fall back to browser-local data, so always use the URL above to test backend persistence.
