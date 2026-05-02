-- D1 Database Schema for Balkan Conflict Rules

-- Users table (Discord authenticated users)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  discriminator TEXT,
  avatar TEXT,
  email TEXT,
  is_admin INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Appeals table
CREATE TABLE IF NOT EXISTS appeals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  title TEXT NOT NULL,
  nickname TEXT NOT NULL,
  faction TEXT,
  contact TEXT,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'balkan-rules',
  user_id INTEGER REFERENCES users(id),
  status TEXT DEFAULT 'pending' NOT NULL,
  verdicts_count INTEGER DEFAULT 0 NOT NULL,
  zapier_sent INTEGER DEFAULT 0 NOT NULL,
  zapier_sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Verdicts table
CREATE TABLE IF NOT EXISTS verdicts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appeal_id INTEGER NOT NULL REFERENCES appeals(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  verdict TEXT NOT NULL, -- guilty, not_guilty, insufficient_evidence
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Unique constraint: one user can only verdict once per appeal
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_verdict ON verdicts(appeal_id, user_id);

-- Banned users table (cannot open review)
CREATE TABLE IF NOT EXISTS banned_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id TEXT UNIQUE NOT NULL,
  reason TEXT,
  banned_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status);
CREATE INDEX IF NOT EXISTS idx_verdicts_appeal_id ON verdicts(appeal_id);
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_banned_discord_id ON banned_users(discord_id);
