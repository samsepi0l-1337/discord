import type { GuildMember } from "discord.js";
import { getGuildConfig } from "../services/configService.js";
import { sendLog } from "../logs.js";
import { EmbedBuilder } from "discord.js";

export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  const config = getGuildConfig(member.guild.id);

  if (config.welcomeChannelId) {
    const channel = await member.guild.channels
      .fetch(config.welcomeChannelId)
      .catch(() => null);
    if (channel?.isTextBased()) {
      await channel
        .send({
          content: `👋 **${member.user.displayName}**님, ${member.guild.name}에 오신 걸 환영해요! 🎉\n잘 놀다 가세요~ ✨`,
        })
        .catch(() => {});
    }
  }

  const client = member.client;
  if (client.user && config.logChannelId) {
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("서버 입장")
      .setDescription(`${member.user} (${member.user.tag})`)
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: `ID: ${member.user.id}` })
      .setTimestamp();
    await sendLog(
      client as import("discord.js").Client<true>,
      member.guild.id,
      embed,
    );
  }
}
