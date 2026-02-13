"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTicketConfig = getTicketConfig;
exports.setTranscriptChannel = setTranscriptChannel;
exports.addSupportRole = addSupportRole;
exports.addSupportUser = addSupportUser;
exports.getOpenTicketByUser = getOpenTicketByUser;
exports.createTicketSession = createTicketSession;
exports.getSessionByChannelId = getSessionByChannelId;
exports.claimTicket = claimTicket;
exports.unclaimTicket = unclaimTicket;
exports.closeTicketSession = closeTicketSession;
exports.deleteOldClosedTickets = deleteOldClosedTickets;
const database_js_1 = require("../config/database.js");
const TICKET_CONFIG_DEFAULT = {
    transcriptChannelId: null,
    supportRoleIds: [],
    supportUserIds: [],
};
function getTicketConfig(guildId) {
    const db = (0, database_js_1.getDb)();
    const row = db
        .prepare("SELECT transcript_channel_id, support_role_ids, support_user_ids FROM ticket_config WHERE guild_id = ?")
        .get(guildId);
    if (!row)
        return { ...TICKET_CONFIG_DEFAULT };
    const parseIds = (s) => s ? s.split(",").filter(Boolean) : [];
    return {
        transcriptChannelId: row.transcript_channel_id ?? null,
        supportRoleIds: parseIds(row.support_role_ids),
        supportUserIds: parseIds(row.support_user_ids),
    };
}
function setTranscriptChannel(guildId, channelId) {
    const db = (0, database_js_1.getDb)();
    const cfg = getTicketConfig(guildId);
    db.prepare(`INSERT INTO ticket_config (guild_id, transcript_channel_id, support_role_ids, support_user_ids)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET transcript_channel_id = excluded.transcript_channel_id`).run(guildId, channelId ?? "", cfg.supportRoleIds.join(","), cfg.supportUserIds.join(","));
}
function addSupportRole(guildId, roleId) {
    const cfg = getTicketConfig(guildId);
    if (cfg.supportRoleIds.includes(roleId))
        return;
    const db = (0, database_js_1.getDb)();
    const next = [...cfg.supportRoleIds, roleId].join(",");
    db.prepare(`INSERT INTO ticket_config (guild_id, transcript_channel_id, support_role_ids, support_user_ids)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET support_role_ids = excluded.support_role_ids`).run(guildId, cfg.transcriptChannelId ?? "", next, cfg.supportUserIds.join(","));
}
function addSupportUser(guildId, userId) {
    const cfg = getTicketConfig(guildId);
    if (cfg.supportUserIds.includes(userId))
        return;
    const db = (0, database_js_1.getDb)();
    const next = [...cfg.supportUserIds, userId].join(",");
    db.prepare(`INSERT INTO ticket_config (guild_id, transcript_channel_id, support_role_ids, support_user_ids)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET support_user_ids = excluded.support_user_ids`).run(guildId, cfg.transcriptChannelId ?? "", cfg.supportRoleIds.join(","), next);
}
function getOpenTicketByUser(guildId, userId) {
    const db = (0, database_js_1.getDb)();
    const row = db
        .prepare("SELECT id, guild_id, channel_id, opener_id, status, claimed_by_id, closed_at, closed_by_id, created_at, updated_at FROM ticket_sessions WHERE guild_id = ? AND opener_id = ? AND status = 'open' LIMIT 1")
        .get(guildId, userId);
    return row ? rowToSession(row) : null;
}
function rowToSession(row) {
    return {
        id: row.id,
        guildId: row.guild_id,
        channelId: row.channel_id,
        openerId: row.opener_id,
        status: row.status,
        claimedById: row.claimed_by_id,
        closedAt: row.closed_at,
        closedById: row.closed_by_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function createTicketSession(guildId, channelId, openerId) {
    const db = (0, database_js_1.getDb)();
    db.prepare("INSERT INTO ticket_sessions (guild_id, channel_id, opener_id, status) VALUES (?, ?, ?, 'open')").run(guildId, channelId, openerId);
    const session = getSessionByChannelId(channelId);
    if (!session)
        throw new Error("Failed to create ticket session");
    return session;
}
function getSessionByChannelId(channelId) {
    const db = (0, database_js_1.getDb)();
    const row = db
        .prepare("SELECT id, guild_id, channel_id, opener_id, status, claimed_by_id, closed_at, closed_by_id, created_at, updated_at FROM ticket_sessions WHERE channel_id = ?")
        .get(channelId);
    return row ? rowToSession(row) : null;
}
function claimTicket(channelId, userId) {
    const db = (0, database_js_1.getDb)();
    db.prepare("UPDATE ticket_sessions SET claimed_by_id = ?, updated_at = datetime('now') WHERE channel_id = ? AND status = 'open'").run(userId, channelId);
    return getSessionByChannelId(channelId);
}
function unclaimTicket(channelId) {
    const db = (0, database_js_1.getDb)();
    db.prepare("UPDATE ticket_sessions SET claimed_by_id = NULL, updated_at = datetime('now') WHERE channel_id = ? AND status = 'open'").run(channelId);
    return getSessionByChannelId(channelId);
}
function closeTicketSession(channelId, closedById) {
    const db = (0, database_js_1.getDb)();
    db.prepare("UPDATE ticket_sessions SET status = 'closed', closed_at = datetime('now'), closed_by_id = ?, updated_at = datetime('now') WHERE channel_id = ?").run(closedById, channelId);
    return getSessionByChannelId(channelId);
}
function deleteOldClosedTickets(retentionDays) {
    const db = (0, database_js_1.getDb)();
    const result = db
        .prepare(`DELETE FROM ticket_sessions WHERE status = 'closed' AND datetime(updated_at) < datetime('now', ?)`)
        .run(`-${retentionDays} days`);
    return result.changes;
}
