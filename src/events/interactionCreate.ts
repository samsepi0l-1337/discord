import type {
  ChatInputCommandInteraction,
  ButtonInteraction,
  Client,
} from "discord.js";
import {
  ChannelType,
  EmbedBuilder,
  AttachmentBuilder,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { handleConfig } from "../commands/config.js";
import {
  handleTicketPanel,
  handleTicketShow,
  getTicketPanelComponents,
  getTicketThreadComponents,
  buildTranscriptText,
  TICKET_PANEL_CUSTOM_ID,
  TICKET_CLOSE_CUSTOM_ID,
  TICKET_CLAIM_CUSTOM_ID,
  TICKET_UNCLAIM_CUSTOM_ID,
} from "../commands/ticket.js";
import {
  getOpenTicketByUser,
  createTicketSession,
  getSessionByChannelId,
  claimTicket,
  unclaimTicket,
  closeTicketSession,
  getTicketConfig,
  setTranscriptChannel,
  addSupportRole,
  addSupportUser,
} from "../services/ticketService.js";

export async function handleInteractionCreate(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  client: Client<true>,
): Promise<void> {
  if (interaction.isChatInputCommand()) {
    const name = interaction.commandName;
    if (name === "config") {
      const sub = interaction.options.getSubcommand();
      const channel = interaction.options.getChannel("channel");
      const result = await handleConfig(interaction.guildId ?? null, sub, {
        getChannel: (n) => interaction.options.getChannel(n),
      });
      await interaction
        .reply({
          content: result.content ?? undefined,
          embeds: result.embeds ?? [],
          ephemeral: true,
        })
        .catch(() => {});
      return;
    }

    if (name === "ticket") {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction
          .reply({ content: "서버에서만 사용할 수 있어요.", ephemeral: true })
          .catch(() => {});
        return;
      }

      if (sub === "panel") {
        const result = await handleTicketPanel();
        await interaction
          .reply({
            ...result,
            ephemeral: false,
          })
          .catch(() => {});
        return;
      }

      if (sub === "show") {
        const result = await handleTicketShow(guildId);
        await interaction
          .reply({ embeds: result.embeds, ephemeral: true })
          .catch(() => {});
        return;
      }

      if (sub === "set-transcripts") {
        const ch = interaction.options.getChannel("channel", true);
        setTranscriptChannel(guildId, ch.id);
        await interaction
          .reply({
            content: `트랜스크립트 채널을 <#${ch.id}> (으)로 설정했어요.`,
            ephemeral: true,
          })
          .catch(() => {});
        return;
      }

      if (sub === "add-support-role") {
        const role = interaction.options.getRole("role", true);
        addSupportRole(guildId, role.id);
        await interaction
          .reply({
            content: `역할 ${role.name}을(를) 티켓 지원팀에 추가했어요.`,
            ephemeral: true,
          })
          .catch(() => {});
        return;
      }

      if (sub === "add-support-user") {
        const user = interaction.options.getUser("user", true);
        addSupportUser(guildId, user.id);
        await interaction
          .reply({
            content: `${user.tag}을(를) 티켓 지원팀에 추가했어요.`,
            ephemeral: true,
          })
          .catch(() => {});
        return;
      }

      const channel = interaction.channel;
      const isThread = channel?.isThread() ?? false;
      const threadId = isThread && channel ? channel.id : null;

      if (sub === "close") {
        if (!isThread || !threadId) {
          await interaction
            .reply({
              content: "티켓 스레드 안에서만 사용할 수 있어요.",
              ephemeral: true,
            })
            .catch(() => {});
          return;
        }
        const session = getSessionByChannelId(threadId);
        if (!session) {
          await interaction
            .reply({
              content: "이 스레드는 티켓이 아니에요.",
              ephemeral: true,
            })
            .catch(() => {});
          return;
        }
        await closeTicketAndArchive(
          interaction,
          session.closedById ?? interaction.user.id,
          client,
        );
        return;
      }

      if (sub === "claim") {
        if (!isThread || !threadId) {
          await interaction
            .reply({
              content: "티켓 스레드 안에서만 사용할 수 있어요.",
              ephemeral: true,
            })
            .catch(() => {});
          return;
        }
        const session = getSessionByChannelId(threadId);
        if (!session) {
          await interaction
            .reply({ content: "이 스레드는 티켓이 아니에요.", ephemeral: true })
            .catch(() => {});
          return;
        }
        claimTicket(threadId, interaction.user.id);
        if (channel) {
          const panelMsg = await findTicketPanelMessage(
            channel as import("discord.js").ThreadChannel,
            client,
          );
          if (panelMsg) {
            await panelMsg
              .edit({
                components: getTicketThreadComponents(interaction.user.id),
              })
              .catch(() => {});
          }
        }
        await interaction
          .reply({
            content: "이 티켓을 담당했어요.",
            ephemeral: true,
          })
          .catch(() => {});
        return;
      }

      if (sub === "unclaim") {
        if (!isThread || !threadId) {
          await interaction
            .reply({
              content: "티켓 스레드 안에서만 사용할 수 있어요.",
              ephemeral: true,
            })
            .catch(() => {});
          return;
        }
        const session = getSessionByChannelId(threadId);
        if (!session) {
          await interaction
            .reply({ content: "이 스레드는 티켓이 아니에요.", ephemeral: true })
            .catch(() => {});
          return;
        }
        unclaimTicket(threadId);
        if (channel) {
          const panelMsg = await findTicketPanelMessage(
            channel as import("discord.js").ThreadChannel,
            client,
          );
          if (panelMsg) {
            await panelMsg
              .edit({ components: getTicketThreadComponents(null) })
              .catch(() => {});
          }
        }
        await interaction
          .reply({ content: "담당 해제했어요.", ephemeral: true })
          .catch(() => {});
        return;
      }

      if (sub === "transfer") {
        if (!isThread || !threadId) {
          await interaction
            .reply({
              content: "티켓 스레드 안에서만 사용할 수 있어요.",
              ephemeral: true,
            })
            .catch(() => {});
          return;
        }
        const target = interaction.options.getUser("user", true);
        const session = getSessionByChannelId(threadId);
        if (!session) {
          await interaction
            .reply({ content: "이 스레드는 티켓이 아니에요.", ephemeral: true })
            .catch(() => {});
          return;
        }
        claimTicket(threadId, target.id);
        if (channel) {
          const panelMsg = await findTicketPanelMessage(
            channel as import("discord.js").ThreadChannel,
            client,
          );
          if (panelMsg) {
            await panelMsg
              .edit({ components: getTicketThreadComponents(target.id) })
              .catch(() => {});
          }
        }
        await interaction
          .reply({
            content: `담당자를 **${target.tag}**(으)로 변경했어요.`,
            ephemeral: true,
          })
          .catch(() => {});
        return;
      }

      if (sub === "add") {
        if (!isThread || !channel) {
          await interaction
            .reply({
              content: "티켓 스레드 안에서만 사용할 수 있어요.",
              ephemeral: true,
            })
            .catch(() => {});
          return;
        }
        const target = interaction.options.getUser("user", true);
        await (channel as import("discord.js").ThreadChannel).members
          .add(target.id)
          .catch(async () => {
            await interaction
              .reply({
                content: "해당 유저를 스레드에 초대할 수 없어요.",
                ephemeral: true,
              })
              .catch(() => {});
          });
        await interaction
          .reply({
            content: `${target.tag}을(를) 티켓에 초대했어요.`,
            ephemeral: true,
          })
          .catch(() => {});
        return;
      }

      if (sub === "remove") {
        if (!isThread || !channel) {
          await interaction
            .reply({
              content: "티켓 스레드 안에서만 사용할 수 있어요.",
              ephemeral: true,
            })
            .catch(() => {});
          return;
        }
        const target = interaction.options.getUser("user", true);
        await (channel as import("discord.js").ThreadChannel).members
          .remove(target.id)
          .catch(async () => {
            await interaction
              .reply({
                content: "해당 유저를 스레드에서 내보낼 수 없어요.",
                ephemeral: true,
              })
              .catch(() => {});
          });
        await interaction
          .reply({
            content: `${target.tag}을(를) 티켓에서 내보냈어요.`,
            ephemeral: true,
          })
          .catch(() => {});
        return;
      }
    }
    return;
  }

  if (interaction.isButton()) {
    const customId = interaction.customId;
    const guildId = interaction.guildId;
    if (!guildId) return;

    if (customId === TICKET_PANEL_CUSTOM_ID) {
      const existing = getOpenTicketByUser(guildId, interaction.user.id);
      if (existing) {
        await interaction
          .reply({
            content: `이미 열린 티켓이 있어요: <#${existing.channelId}>`,
            ephemeral: true,
          })
          .catch(() => {});
        return;
      }
      await interaction.deferReply({ ephemeral: true }).catch(() => {});
      const parent = interaction.channel;
      if (!parent?.isTextBased() || !("threads" in parent)) {
        await interaction
          .editReply({ content: "이 채널에서는 티켓을 만들 수 없어요." })
          .catch(() => {});
        return;
      }
      try {
        const thread = await (
          parent as import("discord.js").TextChannel
        ).threads.create({
          name: `ticket-${interaction.user.username}-${Date.now().toString(36)}`,
          type: ChannelType.PrivateThread,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
          reason: `Ticket by ${interaction.user.tag}`,
        });
        await thread.members.add(interaction.user.id);
        const config = getTicketConfig(guildId);
        for (const roleId of config.supportRoleIds) {
          const role = await interaction.guild?.roles
            .fetch(roleId)
            .catch(() => null);
          if (role?.members) {
            for (const [, m] of role.members)
              await thread.members.add(m.id).catch(() => {});
          }
        }
        for (const userId of config.supportUserIds) {
          await thread.members.add(userId).catch(() => {});
        }
        createTicketSession(guildId, thread.id, interaction.user.id);
        const embed = new EmbedBuilder()
          .setTitle("🎫 티켓")
          .setDescription(
            `**${interaction.user.tag}**님이 티켓을 열었어요.\n아래 버튼으로 클레임하거나 닫을 수 있어요.`,
          )
          .setColor(0x5865f2);
        await thread.send({
          embeds: [embed],
          components: getTicketThreadComponents(null),
        });
        await interaction
          .editReply({
            content: `티켓을 열었어요: <#${thread.id}>`,
          })
          .catch(() => {});
      } catch (err) {
        console.error("Ticket create error:", err);
        await interaction
          .editReply({
            content: "티켓 생성 중 오류가 났어요. 다시 시도해 주세요.",
          })
          .catch(() => {});
      }
      return;
    }

    if (
      customId === TICKET_CLOSE_CUSTOM_ID ||
      customId === TICKET_CLAIM_CUSTOM_ID ||
      customId === TICKET_UNCLAIM_CUSTOM_ID
    ) {
      const channel = interaction.channel;
      if (!channel?.isThread()) return;
      const session = getSessionByChannelId(channel.id);
      if (!session || session.status !== "open") return;

      if (customId === TICKET_CLOSE_CUSTOM_ID) {
        await closeTicketAndArchive(interaction, interaction.user.id, client);
        return;
      }
      if (customId === TICKET_CLAIM_CUSTOM_ID) {
        claimTicket(channel.id, interaction.user.id);
        await interaction.message
          .edit({
            components: getTicketThreadComponents(interaction.user.id),
          })
          .catch(() => {});
        await interaction
          .reply({
            content: "이 티켓을 담당했어요.",
            ephemeral: true,
          })
          .catch(() => {});
        return;
      }
      if (customId === TICKET_UNCLAIM_CUSTOM_ID) {
        unclaimTicket(channel.id);
        await interaction.message
          .edit({
            components: getTicketThreadComponents(null),
          })
          .catch(() => {});
        await interaction
          .reply({
            content: "담당 해제했어요.",
            ephemeral: true,
          })
          .catch(() => {});
      }
    }
  }
}

async function findTicketPanelMessage(
  channel: import("discord.js").ThreadChannel,
  client: Client<true>,
): Promise<import("discord.js").Message | null> {
  const messages = await channel.messages.fetch({ limit: 50 });
  return (
    messages.find(
      (m) =>
        m.author.id === client.user?.id &&
        m.components.some(
          (row) =>
            "components" in row &&
            row.components.some(
              (c) =>
                "customId" in c &&
                (c.customId === TICKET_CLAIM_CUSTOM_ID ||
                  c.customId === TICKET_CLOSE_CUSTOM_ID ||
                  c.customId === TICKET_UNCLAIM_CUSTOM_ID),
            ),
        ),
    ) ?? null
  );
}

async function closeTicketAndArchive(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  closedById: string,
  client: Client<true>,
): Promise<void> {
  const channel = interaction.channel;
  if (!channel?.isThread()) return;
  const session = getSessionByChannelId(channel.id);
  if (!session) return;

  closeTicketSession(channel.id, closedById);
  const transcript = await buildTranscriptText(channel);
  const config = getTicketConfig(session.guildId);
  if (config.transcriptChannelId) {
    const logCh = await client.channels
      .fetch(config.transcriptChannelId)
      .catch(() => null);
    if (logCh?.isTextBased()) {
      const buf = Buffer.from(transcript, "utf-8");
      const attachment = new AttachmentBuilder(buf, {
        name: `ticket-${session.id}-${session.openerId}.txt`,
      });
      await (logCh as import("discord.js").TextChannel)
        .send({
          content: `티켓 #${session.id} 트랜스크립트 (opener: <@${session.openerId}>)`,
          files: [attachment],
        })
        .catch(() => {});
    }
  }
  await channel.setLocked(true).catch(() => {});
  await channel.setArchived(true).catch(() => {});
  const replyContent = "티켓을 닫았어요.";
  if (interaction.isButton()) {
    await interaction
      .reply({ content: replyContent, ephemeral: true })
      .catch(() => {});
  } else {
    await (interaction as ChatInputCommandInteraction)
      .reply({
        content: replyContent,
        ephemeral: true,
      })
      .catch(() => {});
  }
}
