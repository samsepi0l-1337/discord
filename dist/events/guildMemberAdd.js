"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGuildMemberAdd = handleGuildMemberAdd;
const configService_js_1 = require("../services/configService.js");
const logs_js_1 = require("../logs.js");
const discord_js_1 = require("discord.js");
async function handleGuildMemberAdd(member) {
    const config = (0, configService_js_1.getGuildConfig)(member.guild.id);
    if (config.welcomeChannelId) {
        const channel = await member.guild.channels
            .fetch(config.welcomeChannelId)
            .catch(() => null);
        if (channel?.isTextBased()) {
            await channel
                .send({
                content: `👋 **${member.user.displayName}**님, ${member.guild.name}에 오신 걸 환영해요! 🎉\n잘 놀다 가세요~ ✨`,
            })
                .catch(() => { });
        }
    }
    const client = member.client;
    if (client.user && config.logChannelId) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("서버 입장")
            .setDescription(`${member.user} (${member.user.tag})`)
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: `ID: ${member.user.id}` })
            .setTimestamp();
        await (0, logs_js_1.sendLog)(client, member.guild.id, embed);
    }
}
