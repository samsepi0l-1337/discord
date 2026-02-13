import type { VoiceState } from "discord.js";
import type { Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { sendLog } from "../logs.js";

export async function handleVoiceStateUpdate(
  oldState: VoiceState,
  newState: VoiceState,
  client: Client<true>,
): Promise<void> {
  const guildId = newState.guild.id;
  const user =
    newState.member?.user ?? newState.client.users.cache.get(newState.id);
  if (!user) return;

  if (!oldState.channelId && newState.channelId) {
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("음성 채널 입장")
      .setDescription(
        `${user} (${user.tag}) → **${newState.channel?.name ?? "?"}**`,
      )
      .setTimestamp();
    await sendLog(client, guildId, embed);
    return;
  }

  if (oldState.channelId && !newState.channelId) {
    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("음성 채널 퇴장")
      .setDescription(
        `${user} (${user.tag}) ← **${oldState.channel?.name ?? "?"}**`,
      )
      .setTimestamp();
    await sendLog(client, guildId, embed);
    return;
  }

  if (
    oldState.channelId &&
    newState.channelId &&
    oldState.channelId !== newState.channelId
  ) {
    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle("음성 채널 이동")
      .setDescription(
        `${user} (${user.tag})\n**${oldState.channel?.name ?? "?"}** → **${newState.channel?.name ?? "?"}**`,
      )
      .setTimestamp();
    await sendLog(client, guildId, embed);
  }
}
