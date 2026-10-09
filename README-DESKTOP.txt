MEDICAL STORE MANAGEMENT — WINDOWS DESKTOP APP

This edition wraps the existing frontend and Node.js/SQLite backend in an Electron desktop window. The frontend design and app functionality are retained.

BUILD A WINDOWS INSTALLER
1. Install Node.js LTS (20 or newer) from https://nodejs.org/en/download
2. Extract this project ZIP to a normal writable folder.
3. Double-click BUILD-WINDOWS-APP.bat.
4. Wait for npm to download the build dependencies and create the installer. Internet is required for the first build.
5. When it finishes, the installer will be in the dist folder. Its name starts with Medical-Store-Management-Setup.
6. Run the installer, then launch Medical Store Management from the desktop shortcut or Start menu.

DATABASE
The desktop app saves its SQLite database in the current Windows user's Electron application-data directory, not inside the installation folder. This helps keep records after app updates or reinstallations. Back up the app's data folder regularly.

NOTES
- This ZIP contains the source project and Windows build script; it is not itself a compiled .exe installer. Build it on Windows using the steps above.
- The first build requires internet access.
- The backend listens only on the local computer when launched as a desktop app and chooses an available local port.
- The existing backend is an initial integration, not production-grade security. Do not use real sensitive accounts until server-side authentication, password hashing, authorization, and backups are implemented.


INSTALLATION NOTE (updated): This edition uses a persistent JSON data file instead of better-sqlite3, so Windows does not need Python, node-gyp, or Visual C++ Build Tools. Saved data is stored in the application user-data folder when running as a desktop app.
