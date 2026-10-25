# District Quetta Medical Store — Website + Shared Backend

This archive contains the website and a Node.js/Express API backed by PostgreSQL (for example, a Supabase PostgreSQL database). The existing website styling and most feature code are retained.

## Important architecture changes
- Registration and login are now performed by the server, not by comparing browser-local account arrays.
- Passwords are stored as salted scrypt hashes, never as plaintext.
- Authenticated API requests use a signed 12-hour bearer token.
- Hospital, medicine and outflow snapshots are stored in PostgreSQL and read by authorized sessions.
- API state endpoints require authentication. New accounts require a private registration invite code.
- This project must be deployed as a persistent Node web service (for example Render Web Service), not as a static-only Vercel site or a serverless function using local SQLite.

## 1. Prepare the database
1. Create/use a PostgreSQL database. Supabase PostgreSQL is supported.
2. Open the database's SQL Editor.
3. Run the contents of `SUPABASE-SETUP.sql` once.
4. Do not enable public access to these tables through the Supabase Data API. The Express server connects with the database connection string.

This migration creates `app_users` and `app_state` only. It does not drop tables or reset your previous SQLite data. The old local SQLite database is not automatically copied into PostgreSQL. If it contains real records, export and review a backup before importing anything.

## 2. Deploy the website/backend
Recommended deployment: Render Web Service.

1. Upload this project to a private GitHub repository, or replace the appropriate files in your existing repository after taking a backup.
2. In Render, choose **New + → Web Service** and connect the repository.
3. Set the Root Directory to the folder containing this `package.json`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `npm start`.
6. Add these environment variables under the service's **Environment** settings:
   - `DATABASE_URL`: PostgreSQL URI from Supabase → Project Settings → Database → Connection string. Use the URI format and the appropriate password. If a direct database host cannot be reached from the hosting provider, use Supabase's session/pooler connection URI.
   - `JWT_SECRET`: a long random secret of at least 32 characters. Generate a unique value; do not use the example text.
   - `REGISTRATION_INVITE_CODE`: a long private code you give only to authorized staff.
7. Deploy and wait for the service to become live.
8. Open `https://YOUR-SERVICE.onrender.com/api/health`. It should return `ok: true` and `database: "connected"`.
9. Open the service root URL to use the website. The website and API are served from the same origin; do not put database credentials in `api-config.js`.

Never commit `.env` or real secrets to GitHub. `.env.example` contains placeholders only.

## 3. Register and test
1. Open the deployed website over HTTPS.
2. Register with your name, 13-digit CNIC, password (at least 8 characters), and the private invite code.
3. Log in. The app should load the shared state only after successful authentication.
4. Add a test hospital, then open the website in a second browser/session and log in. The hospital list should refresh from the shared database within about 20 seconds.
5. Repeat with a test medicine and outflow. Confirm stock/outflow changes before using the system with real records.
6. Confirm `/api/state` without a bearer token returns HTTP 401.

## Free-tier notes
Free hosting/database plans can sleep, impose storage/connection limits, or change terms. PostgreSQL database availability and backups depend on the selected provider and plan. Do not treat a free tier as a guaranteed backup strategy.

## Current scope and limitations
- This is the website/shared-backend phase only. The Windows desktop application has not been changed in this archive.
- All authenticated accounts currently share the same hospital/medicine/outflow dataset. The invite code restricts registration, but this is not a role-based permissions system. Keep the invite code private and rotate it if exposed.
- The CNIC-only password recovery flow now directs users to an administrator rather than allowing an unsafe reset. Profile password changes use a server endpoint that verifies the current password.
- This archive does not prove the deployed service is live until you configure the database/environment variables and perform the health/auth tests above.
- Use test records first. Back up and plan a migration for any existing SQLite records; do not reset the old database.

## Verification status
The source files pass Node.js syntax checks. A live database integration test cannot be completed until you configure a real PostgreSQL instance and hosting environment variables. Do not treat the deployment as verified until the health, registration, login, authorization, and persistence checks above pass.


VERCEL DEPLOYMENT (this edition is adapted for Vercel, not Render)
1. Upload/commit all files from this folder to the ROOT of the GitHub repository connected to Vercel. Merge/replace matching website files; do not put this folder one level deeper.
2. In Vercel > Project > Settings > Environment Variables, add these for Production (and Preview if you test previews):
   DATABASE_URL = Supabase PostgreSQL connection string (use Supabase Connect > Transaction pooler/Session pooler as appropriate; copy the full URI).
   JWT_SECRET = a new random secret of at least 32 characters.
   REGISTRATION_INVITE_CODE = a private invite code that users must know to register.
3. Redeploy the latest commit after adding/updating variables.
4. Test https://YOUR-VERCEL-DOMAIN/api/health. Expected JSON includes {"ok":true,"database":"connected"}.
5. Do not share DATABASE_URL, JWT_SECRET, or invite code publicly. Never put them in frontend JS.

IMPORTANT: The existing database tables are expected to be public.app_users and public.app_state, created by SUPABASE-SETUP.sql. This build uses the PostgreSQL connection string; it does not use the old medical_store_state Supabase REST table. Existing browser-local accounts/data are not automatically migrated.
