import "dotenv/config";
import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { handleReady } from "./events/ready.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";
import { handleMessageCreate } from "./events/messageCreate.js";
import { handleMessageDelete } from "./events/messageDelete.js";
import { handleMessageUpdate } from "./events/messageUpdate.js";
import { handleGuildMemberUpdate } from "./events/guildMemberUpdate.js";
import { handleVoiceStateUpdate } from "./events/voiceStateUpdate.js";
import { handleInteractionCreate } from "./events/interactionCreate.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.once(Events.ClientReady, (c) => {
  handleReady(c as import("discord.js").Client<true>).catch(console.error);
});

client.on(Events.GuildMemberAdd, (member) => {
  handleGuildMemberAdd(member).catch(console.error);
});

client.on(Events.MessageCreate, (message) => {
  handleMessageCreate(message).catch(console.error);
});

client.on(Events.MessageDelete, (message) => {
  if (client.user) {
    handleMessageDelete(
      message,
      client as import("discord.js").Client<true>,
    ).catch(console.error);
  }
});

client.on(Events.MessageUpdate, (oldMsg, newMsg) => {
  if (client.user) {
    handleMessageUpdate(
      oldMsg,
      newMsg,
      client as import("discord.js").Client<true>,
    ).catch(console.error);
  }
});

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  if (client.user) {
    handleGuildMemberUpdate(
      oldMember,
      newMember,
      client as import("discord.js").Client<true>,
    ).catch(console.error);
  }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  if (client.user) {
    handleVoiceStateUpdate(
      oldState,
      newState,
      client as import("discord.js").Client<true>,
    ).catch(console.error);
  }
});

client.on(Events.InteractionCreate, (interaction) => {
  if (
    client.user &&
    (interaction.isChatInputCommand() || interaction.isButton())
  ) {
    handleInteractionCreate(
      interaction as
        | import("discord.js").ChatInputCommandInteraction
        | import("discord.js").ButtonInteraction,
      client as import("discord.js").Client<true>,
    ).catch(console.error);
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN is required.");
  process.exit(1);
}
client.login(token);
