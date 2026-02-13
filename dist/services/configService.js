"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGuildConfig = getGuildConfig;
exports.setGuildConfig = setGuildConfig;
const database_js_1 = require("../config/database.js");
function getGuildConfig(guildId) {
    const db = (0, database_js_1.getDb)();
    const row = db
        .prepare("SELECT welcome_channel_id, log_channel_id FROM guild_config WHERE guild_id = ?")
        .get(guildId);
    if (!row) {
        return { welcomeChannelId: null, logChannelId: null };
    }
    return {
        welcomeChannelId: row.welcome_channel_id ?? null,
        logChannelId: row.log_channel_id ?? null,
    };
}
function setGuildConfig(guildId, updates) {
    const db = (0, database_js_1.getDb)();
    const current = getGuildConfig(guildId);
    const welcome = updates.welcomeChannelId !== undefined ?
        updates.welcomeChannelId
        : current.welcomeChannelId;
    const log = updates.logChannelId !== undefined ?
        updates.logChannelId
        : current.logChannelId;
    db.prepare(`INSERT INTO guild_config (guild_id, welcome_channel_id, log_channel_id)
     VALUES (?, ?, ?)
     ON CONFLICT(guild_id) DO UPDATE SET
       welcome_channel_id = excluded.welcome_channel_id,
       log_channel_id = excluded.log_channel_id`).run(guildId, welcome ?? null, log ?? null);
}
