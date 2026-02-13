import type { Message, PartialMessage } from "discord.js";
import type { Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { sendLog } from "../logs.js";

export async function handleMessageDelete(
  message: Message | PartialMessage,
  client: Client<true>,
): Promise<void> {
  if (message.partial) {
    try {
      await message.fetch();
    } catch {
      return;
    }
  }
  if (!message.guildId) return;
  const guildId = message.guildId;
  const channel = message.channel;
  const content = message.content?.slice(0, 1000) || "(내용 없음)";
  const author = message.author?.tag ?? "알 수 없음";
  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle("메시지 삭제")
    .addFields(
      { name: "채널", value: `<#${channel.id}>`, inline: true },
      { name: "작성자", value: author, inline: true },
      { name: "내용", value: content, inline: false },
    )
    .setTimestamp();
  await sendLog(client, guildId, embed);
}
