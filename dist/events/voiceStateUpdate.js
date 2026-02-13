"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVoiceStateUpdate = handleVoiceStateUpdate;
const discord_js_1 = require("discord.js");
const logs_js_1 = require("../logs.js");
async function handleVoiceStateUpdate(oldState, newState, client) {
    const guildId = newState.guild.id;
    const user = newState.member?.user ?? newState.client.users.cache.get(newState.id);
    if (!user)
        return;
    if (!oldState.channelId && newState.channelId) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("음성 채널 입장")
            .setDescription(`${user} (${user.tag}) → **${newState.channel?.name ?? "?"}**`)
            .setTimestamp();
        await (0, logs_js_1.sendLog)(client, guildId, embed);
        return;
    }
    if (oldState.channelId && !newState.channelId) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xed4245)
            .setTitle("음성 채널 퇴장")
            .setDescription(`${user} (${user.tag}) ← **${oldState.channel?.name ?? "?"}**`)
            .setTimestamp();
        await (0, logs_js_1.sendLog)(client, guildId, embed);
        return;
    }
    if (oldState.channelId &&
        newState.channelId &&
        oldState.channelId !== newState.channelId) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xfee75c)
            .setTitle("음성 채널 이동")
            .setDescription(`${user} (${user.tag})\n**${oldState.channel?.name ?? "?"}** → **${newState.channel?.name ?? "?"}**`)
            .setTimestamp();
        await (0, logs_js_1.sendLog)(client, guildId, embed);
    }
}
