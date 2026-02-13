"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const ready_js_1 = require("./events/ready.js");
const guildMemberAdd_js_1 = require("./events/guildMemberAdd.js");
const messageCreate_js_1 = require("./events/messageCreate.js");
const messageDelete_js_1 = require("./events/messageDelete.js");
const messageUpdate_js_1 = require("./events/messageUpdate.js");
const guildMemberUpdate_js_1 = require("./events/guildMemberUpdate.js");
const voiceStateUpdate_js_1 = require("./events/voiceStateUpdate.js");
const interactionCreate_js_1 = require("./events/interactionCreate.js");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMessageReactions,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
        discord_js_1.GatewayIntentBits.DirectMessages,
    ],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel],
});
client.once(discord_js_1.Events.ClientReady, (c) => {
    (0, ready_js_1.handleReady)(c).catch(console.error);
});
client.on(discord_js_1.Events.GuildMemberAdd, (member) => {
    (0, guildMemberAdd_js_1.handleGuildMemberAdd)(member).catch(console.error);
});
client.on(discord_js_1.Events.MessageCreate, (message) => {
    (0, messageCreate_js_1.handleMessageCreate)(message).catch(console.error);
});
client.on(discord_js_1.Events.MessageDelete, (message) => {
    if (client.user) {
        (0, messageDelete_js_1.handleMessageDelete)(message, client).catch(console.error);
    }
});
client.on(discord_js_1.Events.MessageUpdate, (oldMsg, newMsg) => {
    if (client.user) {
        (0, messageUpdate_js_1.handleMessageUpdate)(oldMsg, newMsg, client).catch(console.error);
    }
});
client.on(discord_js_1.Events.GuildMemberUpdate, (oldMember, newMember) => {
    if (client.user) {
        (0, guildMemberUpdate_js_1.handleGuildMemberUpdate)(oldMember, newMember, client).catch(console.error);
    }
});
client.on(discord_js_1.Events.VoiceStateUpdate, (oldState, newState) => {
    if (client.user) {
        (0, voiceStateUpdate_js_1.handleVoiceStateUpdate)(oldState, newState, client).catch(console.error);
    }
});
client.on(discord_js_1.Events.InteractionCreate, (interaction) => {
    if (client.user &&
        (interaction.isChatInputCommand() || interaction.isButton())) {
        (0, interactionCreate_js_1.handleInteractionCreate)(interaction, client).catch(console.error);
    }
});
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error("DISCORD_TOKEN is required.");
    process.exit(1);
}
client.login(token);
