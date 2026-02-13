import type { Client, EmbedBuilder, TextChannel } from "discord.js";
import { getGuildConfig } from "./services/configService.js";

export async function sendLog(
  client: Client<true>,
  guildId: string,
  embed: EmbedBuilder,
): Promise<void> {
  const config = getGuildConfig(guildId);
  if (!config.logChannelId) return;
  const channel = await client.channels
    .fetch(config.logChannelId)
    .catch(() => null);
  if (!channel?.isTextBased()) return;
  await (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
}
