"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommand = void 0;
exports.handleConfig = handleConfig;
const discord_js_1 = require("discord.js");
const configService_js_1 = require("../services/configService.js");
exports.configCommand = new discord_js_1.SlashCommandBuilder()
    .setName("config")
    .setDescription("환영/로그 채널 설정 (관리자 전용)")
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addSubcommand((sc) => sc
    .setName("welcome")
    .setDescription("새 멤버 환영 메시지를 보낼 채널 설정")
    .addChannelOption((opt) => opt
    .setName("channel")
    .setDescription("채널 (비우면 해제)")
    .setRequired(false)
    .addChannelTypes(discord_js_1.ChannelType.GuildText)))
    .addSubcommand((sc) => sc
    .setName("log")
    .setDescription("로그를 보낼 채널 설정")
    .addChannelOption((opt) => opt
    .setName("channel")
    .setDescription("채널 (비우면 해제)")
    .setRequired(false)
    .addChannelTypes(discord_js_1.ChannelType.GuildText)))
    .addSubcommand((sc) => sc.setName("show").setDescription("현재 설정 보기"))
    .toJSON();
async function handleConfig(guildId, subcommand, options) {
    if (!guildId)
        return { content: "서버에서만 사용할 수 있어요." };
    if (subcommand === "show") {
        const config = (0, configService_js_1.getGuildConfig)(guildId);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle("설정 요약")
            .setColor(0x5865f2)
            .addFields({
            name: "환영 채널",
            value: config.welcomeChannelId ?
                `<#${config.welcomeChannelId}>`
                : "미설정",
            inline: true,
        }, {
            name: "로그 채널",
            value: config.logChannelId ? `<#${config.logChannelId}>` : "미설정",
            inline: true,
        });
        return { embeds: [embed] };
    }
    if (subcommand === "welcome") {
        const channelId = options.getChannel?.("channel")?.id ?? null;
        (0, configService_js_1.setGuildConfig)(guildId, { welcomeChannelId: channelId });
        return {
            content: channelId ?
                `환영 채널을 <#${channelId}> (으)로 설정했어요.`
                : "환영 채널 설정을 해제했어요.",
        };
    }
    if (subcommand === "log") {
        const channelId = options.getChannel?.("channel")?.id ?? null;
        (0, configService_js_1.setGuildConfig)(guildId, { logChannelId: channelId });
        return {
            content: channelId ?
                `로그 채널을 <#${channelId}> (으)로 설정했어요.`
                : "로그 채널 설정을 해제했어요.",
        };
    }
    return { content: "알 수 없는 하위 명령이에요." };
}
