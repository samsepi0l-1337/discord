"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessageDelete = handleMessageDelete;
const discord_js_1 = require("discord.js");
const logs_js_1 = require("../logs.js");
async function handleMessageDelete(message, client) {
    if (message.partial) {
        try {
            await message.fetch();
        }
        catch {
            return;
        }
    }
    if (!message.guildId)
        return;
    const guildId = message.guildId;
    const channel = message.channel;
    const content = message.content?.slice(0, 1000) || "(내용 없음)";
    const author = message.author?.tag ?? "알 수 없음";
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("메시지 삭제")
        .addFields({ name: "채널", value: `<#${channel.id}>`, inline: true }, { name: "작성자", value: author, inline: true }, { name: "내용", value: content, inline: false })
        .setTimestamp();
    await (0, logs_js_1.sendLog)(client, guildId, embed);
}
