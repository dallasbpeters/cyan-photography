-- Cyan Photography — Neon (PostgreSQL)
-- Run via: pnpm db:migrate

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON categories (sort_order);

INSERT INTO categories (slug, label, sort_order) VALUES
  ('film', 'Film', 0),
  ('photography', 'Photography', 1)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS photos_sort_order_idx ON photos (sort_order);
-- Index on category_id is created in db/patches/001_legacy_photo_categories.sql so legacy DBs
-- (where CREATE TABLE photos was skipped) are not asked for category_id before the patch adds it.

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
