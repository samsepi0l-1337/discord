"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.initDb = initDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(process.cwd(), "data", "bot.db");
let dbInstance = null;
function getDb() {
    if (dbInstance)
        return dbInstance;
    const dataDir = path_1.default.dirname(dbPath);
    if (!fs_1.default.existsSync(dataDir))
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    dbInstance = new better_sqlite3_1.default(dbPath);
    return dbInstance;
}
function initDb(db) {
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
