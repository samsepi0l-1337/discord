"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGuildMemberUpdate = handleGuildMemberUpdate;
const discord_js_1 = require("discord.js");
const logs_js_1 = require("../logs.js");
async function handleGuildMemberUpdate(oldMember, newMember, client) {
    if (!oldMember.roles?.cache)
        return;
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    const added = newRoles.filter((r) => !oldRoles.has(r.id));
    const removed = oldRoles.filter((_, id) => !newRoles.has(id));
    if (added.size === 0 && removed.size === 0)
        return;
    const parts = [];
    if (added.size)
        parts.push(`추가: ${added.map((r) => r.name).join(", ")}`);
    if (removed.size)
        parts.push(`제거: ${removed.map((r) => r.name).join(", ")}`);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("역할 변경")
        .setDescription(`${newMember.user} (${newMember.user.tag})`)
        .addFields({ name: "변경 내용", value: parts.join("\n"), inline: false })
        .setThumbnail(newMember.user.displayAvatarURL())
        .setFooter({ text: `ID: ${newMember.user.id}` })
        .setTimestamp();
    await (0, logs_js_1.sendLog)(client, newMember.guild.id, embed);
}
