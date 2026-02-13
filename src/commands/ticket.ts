import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import {
  getTicketConfig,
  setTranscriptChannel,
  addSupportRole,
  addSupportUser,
} from "../services/ticketService.js";

const TICKET_PANEL_CUSTOM_ID = "ticket_open";
const TICKET_CLOSE_CUSTOM_ID = "ticket_close";
const TICKET_CLAIM_CUSTOM_ID = "ticket_claim";
const TICKET_UNCLAIM_CUSTOM_ID = "ticket_unclaim";

export const ticketCommand = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("티켓 패널 및 설정")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sc) =>
    sc
      .setName("panel")
      .setDescription("이 채널에 티켓 생성 버튼 메시지를 올립니다."),
  )
  .addSubcommand((sc) =>
    sc
      .setName("set-transcripts")
      .setDescription("티켓 종료 시 트랜스크립트를 보낼 채널 설정")
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("채널")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName("add-support-role")
      .setDescription("티켓에 자동 초대할 역할 추가")
      .addRoleOption((opt) =>
        opt.setName("role").setDescription("역할").setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName("add-support-user")
      .setDescription("티켓에 자동 초대할 유저 추가")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("유저").setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc.setName("show").setDescription("현재 티켓 설정 요약"),
  )
  .addSubcommand((sc) =>
    sc
      .setName("close")
      .setDescription("현재 티켓 스레드 닫기 (스레드 안에서만)"),
  )
  .addSubcommand((sc) =>
    sc.setName("claim").setDescription("이 티켓 담당하기 (스레드 안에서만)"),
  )
  .addSubcommand((sc) =>
    sc.setName("unclaim").setDescription("담당 해제 (스레드 안에서만)"),
  )
  .addSubcommand((sc) =>
    sc
      .setName("transfer")
      .setDescription("티켓 담당자를 다른 유저로 변경")
      .addUserOption((opt) =>
        opt
          .setName("user")
          .setDescription("담당자로 지정할 유저")
          .setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName("add")
      .setDescription("티켓에 유저 초대 (스레드 안에서만)")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("초대할 유저").setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName("remove")
      .setDescription("티켓에서 유저 내보내기 (스레드 안에서만)")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("내보낼 유저").setRequired(true),
      ),
  )
  .toJSON();

export function getTicketPanelComponents(): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(TICKET_PANEL_CUSTOM_ID)
      .setLabel("티켓 열기")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎫"),
  );
  return [row];
}

export function getTicketThreadComponents(
  claimedById: string | null,
): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>();
  if (claimedById) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(TICKET_UNCLAIM_CUSTOM_ID)
        .setLabel("언클레임")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(TICKET_CLOSE_CUSTOM_ID)
        .setLabel("닫기")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒"),
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(TICKET_CLAIM_CUSTOM_ID)
        .setLabel("클레임")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(TICKET_CLOSE_CUSTOM_ID)
        .setLabel("닫기")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒"),
    );
  }
  return [row];
}

export {
  TICKET_PANEL_CUSTOM_ID,
  TICKET_CLOSE_CUSTOM_ID,
  TICKET_CLAIM_CUSTOM_ID,
  TICKET_UNCLAIM_CUSTOM_ID,
};

export async function handleTicketPanel(): Promise<{
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}> {
  const embed = new EmbedBuilder()
    .setTitle("🎫 티켓")
    .setDescription("아래 버튼을 눌러 지원 티켓을 열어주세요.")
    .setColor(0x5865f2);
  return {
    embeds: [embed],
    components: getTicketPanelComponents(),
  };
}

export async function handleTicketShow(guildId: string): Promise<{
  embeds: EmbedBuilder[];
}> {
  const config = getTicketConfig(guildId);
  const embed = new EmbedBuilder()
    .setTitle("티켓 설정")
    .setColor(0x5865f2)
    .addFields(
      {
        name: "트랜스크립트 채널",
        value:
          config.transcriptChannelId ?
            `<#${config.transcriptChannelId}>`
          : "미설정",
        inline: true,
      },
      {
        name: "지원 역할",
        value:
          config.supportRoleIds.length > 0 ?
            config.supportRoleIds.map((id) => `<@&${id}>`).join(", ")
          : "없음",
        inline: true,
      },
      {
        name: "지원 유저",
        value:
          config.supportUserIds.length > 0 ?
            config.supportUserIds.map((id) => `<@${id}>`).join(", ")
          : "없음",
        inline: true,
      },
    );
  return { embeds: [embed] };
}

const TRANSCRIPT_MESSAGE_LIMIT = 100;

export async function buildTranscriptText(
  channel: import("discord.js").ThreadChannel,
): Promise<string> {
  const lines: string[] = [];
  let lastId: string | undefined;
  const perPage = 50;
  for (let i = 0; i < Math.ceil(TRANSCRIPT_MESSAGE_LIMIT / perPage); i++) {
    if (lines.length >= TRANSCRIPT_MESSAGE_LIMIT) break;
    const opts: { limit: number; before?: string } = { limit: perPage };
    if (lastId) opts.before = lastId;
    const messages = await channel.messages.fetch(opts);
    if (messages.size === 0) break;
    const sorted = messages.sort(
      (a, b) => a.createdTimestamp - b.createdTimestamp,
    );
    for (const [, msg] of sorted) {
      if (lines.length >= TRANSCRIPT_MESSAGE_LIMIT) break;
      const time = msg.createdAt.toISOString();
      const author = msg.author.tag;
      const content = msg.content || "(첨부만)";
      const attachments = msg.attachments.map((a) => a.url).join(" ");
      lines.push(
        `[${time}] ${author}: ${content}${attachments ? " " + attachments : ""}`,
      );
    }
    lastId = sorted.first()?.id;
    if (messages.size < perPage) break;
  }
  return lines.reverse().join("\n") || "(메시지 없음)";
}
