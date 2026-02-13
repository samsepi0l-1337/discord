"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessageUpdate = handleMessageUpdate;
const discord_js_1 = require("discord.js");
const logs_js_1 = require("../logs.js");
async function handleMessageUpdate(oldMessage, newMessage, client) {
    if (oldMessage.partial || newMessage.partial)
        return;
    if (oldMessage.content === newMessage.content)
        return;
    if (!newMessage.guildId)
        return;
    const contentOld = oldMessage.content?.slice(0, 500) || "(없음)";
    const contentNew = newMessage.content?.slice(0, 500) || "(없음)";
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle("메시지 수정")
        .addFields({ name: "채널", value: `<#${newMessage.channel.id}>`, inline: true }, {
        name: "작성자",
        value: newMessage.author?.tag ?? "알 수 없음",
        inline: true,
    }, { name: "이전", value: contentOld, inline: false }, { name: "이후", value: contentNew, inline: false })
        .setTimestamp();
    await (0, logs_js_1.sendLog)(client, newMessage.guildId, embed);
}
