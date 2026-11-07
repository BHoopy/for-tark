-- Performance indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON psimply.teams (tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON psimply.matches (tournament_id);
CREATE INDEX IF NOT EXISTS idx_comments_tournament_id ON psimply.comments (tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON psimply.tournaments (created_by);
CREATE INDEX IF NOT EXISTS idx_users_uid ON psimply.users (uid);
