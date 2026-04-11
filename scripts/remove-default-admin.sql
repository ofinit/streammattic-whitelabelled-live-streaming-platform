-- Remove legacy template admin (older schema seeds used fixed UUID …0001 + admin@streamlivee.com).
-- Take a backup first. Ensure at least one other admin exists before running.
-- Safe to run in psql: \i scripts/remove-default-admin.sql

BEGIN;

DELETE FROM users
WHERE id = '00000000-0000-0000-0000-000000000001'
   OR lower(email) = 'admin@streamlivee.com';

COMMIT;
