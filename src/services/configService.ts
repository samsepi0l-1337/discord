import { getDb } from "../config/database.js";

export interface GuildConfig {
  welcomeChannelId: string | null;
  logChannelId: string | null;
}

export function getGuildConfig(guildId: string): GuildConfig {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT welcome_channel_id, log_channel_id FROM guild_config WHERE guild_id = ?",
    )
    .get(guildId) as
    | { welcome_channel_id: string | null; log_channel_id: string | null }
    | undefined;

  if (!row) {
    return { welcomeChannelId: null, logChannelId: null };
  }
  return {
    welcomeChannelId: row.welcome_channel_id ?? null,
    logChannelId: row.log_channel_id ?? null,
  };
}

export function setGuildConfig(
  guildId: string,
  updates: { welcomeChannelId?: string | null; logChannelId?: string | null },
): void {
  const db = getDb();
  const current = getGuildConfig(guildId);
  const welcome =
    updates.welcomeChannelId !== undefined ?
      updates.welcomeChannelId
    : current.welcomeChannelId;
  const log =
    updates.logChannelId !== undefined ?
      updates.logChannelId
    : current.logChannelId;

  db.prepare(
    `INSERT INTO guild_config (guild_id, welcome_channel_id, log_channel_id)
     VALUES (?, ?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET
       welcome_channel_id = excluded.welcome_channel_id,
       log_channel_id = excluded.log_channel_id`,
  ).run(guildId, welcome ?? null, log ?? null);
}
