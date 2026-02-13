"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessageCreate = handleMessageCreate;
const GREETING_MAP = [
    { keyword: "안녕", reply: "안녕! 👋" },
    { keyword: "굿모닝", reply: "굿모닝! ☀️ 좋은 아침이에요~" },
    { keyword: "잘자", reply: "잘 자요! 🌙 좋은 밤 되세요~" },
];
async function handleMessageCreate(message) {
    if (message.author.bot)
        return;
    const content = message.content.trim().toLowerCase();
    for (const { keyword, reply } of GREETING_MAP) {
        if (content.includes(keyword)) {
            await message.reply(reply).catch(() => { });
            break;
        }
    }
}
