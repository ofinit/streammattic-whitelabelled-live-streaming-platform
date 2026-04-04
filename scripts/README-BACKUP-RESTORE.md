# Postgres backup and local restore

## One-command local setup (after Postgres is installed)

### Install PostgreSQL on D: drive (Windows)

1. **Run as Administrator:** Right-click PowerShell → Run as administrator, then:
   ```powershell
   cd "d:\PROJECTS\Cursor AI\Stream-Livee"
   .\scripts\install-postgresql-d.ps1
   ```
   This downloads the installer (if needed) and installs PostgreSQL 18 to **D:\PostgreSQL\18** with superuser password `postgres`. If the download is still in progress or the exe is in use, close other apps and run the script again.

2. Create the database:
   ```powershell
   & "D:\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE streamlivee_local;"
   ```
   (Password: `postgres`.)

### Or install to default C: drive

1. Install PostgreSQL from [Windows](https://www.postgresql.org/download/windows/); set password (e.g. `postgres`).
2. Create the database:
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE streamlivee_local;"
   ```
3. In `.env.local`, set **DATABASE_URL** to your local DB (and **PRODUCTION_DATABASE_URL** or **DATABASE_URL** for backup source):
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/streamlivee_local
   PRODUCTION_DATABASE_URL=postgresql://...source Postgres URL...  # optional, for backup source
   ```
4. Run: **`npm run db:setup-local`** (applies schema + restores latest backup; no psql needed).
5. Run: **`npm run dev`** — app uses your local DB.

---

## Manual steps

### 1. Get production connection string

- Use your **Postgres** connection string (any host: local, VPS, or managed Postgres).
- For **pg_dump** (full backup): a direct (non-pooled) URL is recommended. Pooled URLs can sometimes cause pg_dump to fail.
- For **Node/pg fallback** (no pg_dump): any valid `DATABASE_URL` works.

## 2. Add to `.env.local`

```env
# Source Postgres (for backup). Optional if you only restore.
# Use your Coolify/VPS connection string; never commit real URLs. Rotate DB passwords if a URL was ever leaked.
PRODUCTION_DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Local Postgres (for restore target and dev). Create a blank DB first.
DATABASE_URL="postgresql://postgres:password@localhost:5432/streamlivee_local"
```

## 3. Backup production to a file

```bash
npm run db:backup
# or: node --env-file=.env.local scripts/backup-db.js
```

- Writes: `backups/postgres-backup-YYYYMMDDHHMMSS.sql`
- If **pg_dump** is not installed, the script falls back to a **data-only** dump via pg client. Use `--api` to force that:
  ```bash
  node --env-file=.env.local scripts/backup-db.js --api
  ```

**Installing pg_dump (recommended):**

- **Windows:** Install [PostgreSQL](https://www.postgresql.org/download/windows/) and add its `bin` folder to PATH.
- **Mac:** `brew install postgresql`
- **Linux:** `sudo apt-get install postgresql-client` (or equivalent).

## 4. Local database setup

Create an empty database for restore (e.g. in local Postgres):

```sql
CREATE DATABASE streamlivee_local;
```

Point `DATABASE_URL` in `.env.local` to this DB (see above).

## 5. Restore backup into local

**If you used the default backup (pg_dump):**

```bash
node --env-file=.env.local scripts/restore-local.js
```

Or pass the file explicitly:

```bash
node --env-file=.env.local scripts/restore-local.js backups/postgres-backup-20250108120000.sql
```

This runs the SQL file against `DATABASE_URL` (your local DB). The full dump includes `DROP` and `CREATE`, so existing objects are replaced.

**If you used data-only backup (`--api`):**

1. Apply schema first (migrations or your schema scripts).
2. Then run the restore script above. If you get duplicate key errors, use a fresh empty DB or truncate tables before restore.

## 6. Run app against local DB

Keep `DATABASE_URL` in `.env.local` pointing to the local DB. Start the app:

```bash
npm run dev
```

You now have a local copy of production data.
