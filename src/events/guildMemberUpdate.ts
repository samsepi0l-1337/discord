import type { GuildMember, PartialGuildMember } from "discord.js";
import type { Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { sendLog } from "../logs.js";

export async function handleGuildMemberUpdate(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember,
  client: Client<true>,
): Promise<void> {
  if (!oldMember.roles?.cache) return;
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;
  const added = newRoles.filter((r) => !oldRoles.has(r.id));
  const removed = oldRoles.filter((_, id) => !newRoles.has(id));
  if (added.size === 0 && removed.size === 0) return;

  const parts: string[] = [];
  if (added.size) parts.push(`추가: ${added.map((r) => r.name).join(", ")}`);
  if (removed.size)
    parts.push(`제거: ${removed.map((r) => r.name).join(", ")}`);
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("역할 변경")
    .setDescription(`${newMember.user} (${newMember.user.tag})`)
    .addFields({ name: "변경 내용", value: parts.join("\n"), inline: false })
    .setThumbnail(newMember.user.displayAvatarURL())
    .setFooter({ text: `ID: ${newMember.user.id}` })
    .setTimestamp();
  await sendLog(client, newMember.guild.id, embed);
}
