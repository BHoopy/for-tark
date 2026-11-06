-- Email/password auth backed by the psimply schema (replaces Firebase Auth)

ALTER TABLE psimply.users
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON psimply.users (lower(email))
  WHERE email IS NOT NULL;
