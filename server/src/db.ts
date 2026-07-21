import { Pool } from 'pg';

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://videolib:videolib@localhost:5432/videolib'
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS videos (
  id               SERIAL PRIMARY KEY,
  file_path        TEXT UNIQUE NOT NULL,
  file_name        TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  tags             TEXT[] NOT NULL DEFAULT '{}',
  category_path    TEXT NOT NULL DEFAULT '',
  size_bytes       BIGINT NOT NULL DEFAULT 0,
  duration_seconds REAL,
  width            INT,
  height           INT,
  play_count       INT NOT NULL DEFAULT 0,
  download_count   INT NOT NULL DEFAULT 0,
  liked            BOOLEAN NOT NULL DEFAULT FALSE,
  favorite         BOOLEAN NOT NULL DEFAULT FALSE,
  favorited_at     TIMESTAMPTZ,
  last_played_at   TIMESTAMPTZ,
  file_modified_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrations for databases created before likes/favorites existed.
ALTER TABLE videos ADD COLUMN IF NOT EXISTS liked        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS favorite     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS favorited_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_videos_favorite ON videos (favorite) WHERE favorite;

CREATE INDEX IF NOT EXISTS idx_videos_category ON videos (category_path);
CREATE INDEX IF NOT EXISTS idx_videos_title    ON videos (title);

CREATE TABLE IF NOT EXISTS play_events (
  id        SERIAL PRIMARY KEY,
  video_id  INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_play_events_date ON play_events (played_at);
`;

/** Wait for Postgres to be reachable, then ensure schema exists. */
export async function initDb(maxRetries = 30, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.log(`Waiting for database... (attempt ${attempt}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  await pool.query(SCHEMA);
  console.log('Database ready.');
}
