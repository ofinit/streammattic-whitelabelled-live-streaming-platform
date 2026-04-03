-- CloudJiffy / Jelastic PostgreSQL: create app database and role.
-- Connect as a superuser or database admin (e.g. webadmin) in psql or PhpPgAdmin.
-- Replace CHANGE_ME_STRONG_PASSWORD with a unique secret before running.
-- After this, set DATABASE_URL on the app VPS, e.g.:
--   postgresql://streamlivee_app:CHANGE_ME_STRONG_PASSWORD@192.168.8.103:5432/streamlivee
-- Use the Postgres node's internal LAN IP from the application server (see your topology).

CREATE USER streamlivee_app WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

CREATE DATABASE streamlivee OWNER streamlivee_app;

-- Optional: if you prefer a separate migration user, create DB with postgres owner and GRANT instead.
-- The migration script needs CREATE on public; DATABASE OWNER has that by default.
