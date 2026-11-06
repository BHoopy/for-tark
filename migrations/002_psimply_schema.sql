CREATE SCHEMA IF NOT EXISTS psimply;

CREATE TABLE IF NOT EXISTS psimply.users (
  id text PRIMARY KEY,
  uid text NOT NULL UNIQUE,
  display_name text,
  email text,
  photo_url text,
  cover_image_url text,
  whatsapp text,
  x text,
  facebook text,
  phone text,
  discord text,
  favorite_tournaments text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS psimply.tournaments (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  rules text,
  format text NOT NULL CHECK (format IN ('round_robin','knockout','group_then_knockout')),
  match_type text CHECK (match_type IN ('single_leg','two_leg')),
  status text NOT NULL CHECK (status IN ('draft','upcoming','ongoing','completed')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cover_image_url text,
  number_of_teams int,
  moderators text[] DEFAULT '{}',
  fixtures jsonb DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS psimply.teams (
  id text PRIMARY KEY,
  tournament_id text NOT NULL REFERENCES psimply.tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  roster text[] DEFAULT '{}',
  logo text
);

CREATE TABLE IF NOT EXISTS psimply.matches (
  id text PRIMARY KEY,
  tournament_id text NOT NULL REFERENCES psimply.tournaments(id) ON DELETE CASCADE,
  round int NOT NULL,
  match_number int NOT NULL,
  team1_id text REFERENCES psimply.teams(id) ON DELETE SET NULL,
  team2_id text REFERENCES psimply.teams(id) ON DELETE SET NULL,
  score1_leg1 int,
  score2_leg1 int,
  score1_leg2 int,
  score2_leg2 int,
  status text NOT NULL CHECK (status IN ('pending','completed')),
  next_match_id text,
  is_bronze_match boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS psimply.comments (
  id text PRIMARY KEY,
  tournament_id text NOT NULL REFERENCES psimply.tournaments(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_by text NOT NULL,
  author_name text NOT NULL,
  author_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS psimply.team_lists (
  id text PRIMARY KEY,
  name text NOT NULL,
  teams jsonb NOT NULL DEFAULT '[]'
);
