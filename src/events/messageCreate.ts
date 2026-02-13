import type { Message } from "discord.js";

const GREETING_MAP: { keyword: string; reply: string }[] = [
  { keyword: "안녕", reply: "안녕! 👋" },
  { keyword: "굿모닝", reply: "굿모닝! ☀️ 좋은 아침이에요~" },
  { keyword: "잘자", reply: "잘 자요! 🌙 좋은 밤 되세요~" },
];

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot) return;
  const content = message.content.trim().toLowerCase();
  for (const { keyword, reply } of GREETING_MAP) {
    if (content.includes(keyword)) {
      await message.reply(reply).catch(() => {});
      break;
    }
  }
}
