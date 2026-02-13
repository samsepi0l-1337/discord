import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "bot.db");

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  dbInstance = new Database(dbPath);
  return dbInstance;
}

export function initDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id TEXT PRIMARY KEY,
      welcome_channel_id TEXT,
      log_channel_id TEXT
    );

    CREATE TABLE IF NOT EXISTS ticket_config (
      guild_id TEXT PRIMARY KEY,
      transcript_channel_id TEXT,
      support_role_ids TEXT,
      support_user_ids TEXT
    );

    CREATE TABLE IF NOT EXISTS ticket_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL UNIQUE,
      opener_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      claimed_by_id TEXT,
      closed_at TEXT,
      closed_by_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_ticket_sessions_guild_opener ON ticket_sessions(guild_id, opener_id, status);
    CREATE INDEX IF NOT EXISTS idx_ticket_sessions_updated ON ticket_sessions(updated_at);
  `);
}
