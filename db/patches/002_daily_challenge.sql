-- Daily inspiration challenge + per-user journal (UTC calendar day).

CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  image_thumb_url TEXT,
  photographer_name TEXT,
  photographer_username TEXT,
  unsplash_photo_id TEXT,
  unsplash_html_link TEXT,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_date)
);

CREATE INDEX IF NOT EXISTS challenge_journal_user_date_idx ON challenge_journal_entries (user_id, challenge_date DESC);
