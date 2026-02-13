import { getDb } from "../config/database.js";

export interface TicketConfig {
  transcriptChannelId: string | null;
  supportRoleIds: string[];
  supportUserIds: string[];
}

export interface TicketSession {
  id: number;
  guildId: string;
  channelId: string;
  openerId: string;
  status: "open" | "closed";
  claimedById: string | null;
  closedAt: string | null;
  closedById: string | null;
  createdAt: string;
  updatedAt: string;
}

const TICKET_CONFIG_DEFAULT: TicketConfig = {
  transcriptChannelId: null,
  supportRoleIds: [],
  supportUserIds: [],
};

export function getTicketConfig(guildId: string): TicketConfig {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT transcript_channel_id, support_role_ids, support_user_ids FROM ticket_config WHERE guild_id = ?",
    )
    .get(guildId) as
    | {
        transcript_channel_id: string | null;
        support_role_ids: string | null;
        support_user_ids: string | null;
      }
    | undefined;

  if (!row) return { ...TICKET_CONFIG_DEFAULT };

  const parseIds = (s: string | null): string[] =>
    s ? s.split(",").filter(Boolean) : [];

  return {
    transcriptChannelId: row.transcript_channel_id ?? null,
    supportRoleIds: parseIds(row.support_role_ids),
    supportUserIds: parseIds(row.support_user_ids),
  };
}

export function setTranscriptChannel(
  guildId: string,
  channelId: string | null,
): void {
  const db = getDb();
  const cfg = getTicketConfig(guildId);
  db.prepare(
    `INSERT INTO ticket_config (guild_id, transcript_channel_id, support_role_ids, support_user_ids)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET transcript_channel_id = excluded.transcript_channel_id`,
  ).run(
    guildId,
    channelId ?? "",
    cfg.supportRoleIds.join(","),
    cfg.supportUserIds.join(","),
  );
}

export function addSupportRole(guildId: string, roleId: string): void {
  const cfg = getTicketConfig(guildId);
  if (cfg.supportRoleIds.includes(roleId)) return;
  const db = getDb();
  const next = [...cfg.supportRoleIds, roleId].join(",");
  db.prepare(
    `INSERT INTO ticket_config (guild_id, transcript_channel_id, support_role_ids, support_user_ids)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET support_role_ids = excluded.support_role_ids`,
  ).run(
    guildId,
    cfg.transcriptChannelId ?? "",
    next,
    cfg.supportUserIds.join(","),
  );
}

export function addSupportUser(guildId: string, userId: string): void {
  const cfg = getTicketConfig(guildId);
  if (cfg.supportUserIds.includes(userId)) return;
  const db = getDb();
  const next = [...cfg.supportUserIds, userId].join(",");
  db.prepare(
    `INSERT INTO ticket_config (guild_id, transcript_channel_id, support_role_ids, support_user_ids)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET support_user_ids = excluded.support_user_ids`,
  ).run(
    guildId,
    cfg.transcriptChannelId ?? "",
    cfg.supportRoleIds.join(","),
    next,
  );
}

export function getOpenTicketByUser(
  guildId: string,
  userId: string,
): TicketSession | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, guild_id, channel_id, opener_id, status, claimed_by_id, closed_at, closed_by_id, created_at, updated_at FROM ticket_sessions WHERE guild_id = ? AND opener_id = ? AND status = 'open' LIMIT 1",
    )
    .get(guildId, userId) as TicketSessionRow | undefined;
  return row ? rowToSession(row) : null;
}

interface TicketSessionRow {
  id: number;
  guild_id: string;
  channel_id: string;
  opener_id: string;
  status: string;
  claimed_by_id: string | null;
  closed_at: string | null;
  closed_by_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSession(row: TicketSessionRow): TicketSession {
  return {
    id: row.id,
    guildId: row.guild_id,
    channelId: row.channel_id,
    openerId: row.opener_id,
    status: row.status as "open" | "closed",
    claimedById: row.claimed_by_id,
    closedAt: row.closed_at,
    closedById: row.closed_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createTicketSession(
  guildId: string,
  channelId: string,
  openerId: string,
): TicketSession {
  const db = getDb();
  db.prepare(
    "INSERT INTO ticket_sessions (guild_id, channel_id, opener_id, status) VALUES (?, ?, ?, 'open')",
  ).run(guildId, channelId, openerId);
  const session = getSessionByChannelId(channelId);
  if (!session) throw new Error("Failed to create ticket session");
  return session;
}

export function getSessionByChannelId(channelId: string): TicketSession | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, guild_id, channel_id, opener_id, status, claimed_by_id, closed_at, closed_by_id, created_at, updated_at FROM ticket_sessions WHERE channel_id = ?",
    )
    .get(channelId) as TicketSessionRow | undefined;
  return row ? rowToSession(row) : null;
}

export function claimTicket(
  channelId: string,
  userId: string,
): TicketSession | null {
  const db = getDb();
  db.prepare(
    "UPDATE ticket_sessions SET claimed_by_id = ?, updated_at = datetime('now') WHERE channel_id = ? AND status = 'open'",
  ).run(userId, channelId);
  return getSessionByChannelId(channelId);
}

export function unclaimTicket(channelId: string): TicketSession | null {
  const db = getDb();
  db.prepare(
    "UPDATE ticket_sessions SET claimed_by_id = NULL, updated_at = datetime('now') WHERE channel_id = ? AND status = 'open'",
  ).run(channelId);
  return getSessionByChannelId(channelId);
}

export function closeTicketSession(
  channelId: string,
  closedById: string,
): TicketSession | null {
  const db = getDb();
  db.prepare(
    "UPDATE ticket_sessions SET status = 'closed', closed_at = datetime('now'), closed_by_id = ?, updated_at = datetime('now') WHERE channel_id = ?",
  ).run(closedById, channelId);
  return getSessionByChannelId(channelId);
}

export function deleteOldClosedTickets(retentionDays: number): number {
  const db = getDb();
  const result = db
    .prepare(
      `DELETE FROM ticket_sessions WHERE status = 'closed' AND datetime(updated_at) < datetime('now', ?)`,
    )
    .run(`-${retentionDays} days`);
  return result.changes;
}
