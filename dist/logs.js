"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLog = sendLog;
const configService_js_1 = require("./services/configService.js");
async function sendLog(client, guildId, embed) {
    const config = (0, configService_js_1.getGuildConfig)(guildId);
    if (!config.logChannelId)
        return;
    const channel = await client.channels
        .fetch(config.logChannelId)
        .catch(() => null);
    if (!channel?.isTextBased())
        return;
    await channel.send({ embeds: [embed] }).catch(() => { });
}
