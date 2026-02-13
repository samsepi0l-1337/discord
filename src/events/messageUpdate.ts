import type { Message, PartialMessage } from "discord.js";
import type { Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { sendLog } from "../logs.js";

export async function handleMessageUpdate(
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage,
  client: Client<true>,
): Promise<void> {
  if (oldMessage.partial || newMessage.partial) return;
  if (oldMessage.content === newMessage.content) return;
  if (!newMessage.guildId) return;
  const contentOld = oldMessage.content?.slice(0, 500) || "(없음)";
  const contentNew = newMessage.content?.slice(0, 500) || "(없음)";
  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle("메시지 수정")
    .addFields(
      { name: "채널", value: `<#${newMessage.channel.id}>`, inline: true },
      {
        name: "작성자",
        value: newMessage.author?.tag ?? "알 수 없음",
        inline: true,
      },
      { name: "이전", value: contentOld, inline: false },
      { name: "이후", value: contentNew, inline: false },
    )
    .setTimestamp();
  await sendLog(client, newMessage.guildId, embed);
}
