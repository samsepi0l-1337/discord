"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReady = handleReady;
const discord_js_1 = require("discord.js");
const database_js_1 = require("../config/database.js");
const config_js_1 = require("../commands/config.js");
const ticket_js_1 = require("../commands/ticket.js");
const ticketService_js_1 = require("../services/ticketService.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const TICKET_RETENTION_DAYS = parseInt(process.env.TICKET_RETENTION_DAYS ?? "30", 10);
async function handleReady(client) {
    const dataDir = path_1.default.join(process.cwd(), "data");
    if (!fs_1.default.existsSync(dataDir))
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    const db = (0, database_js_1.getDb)();
    (0, database_js_1.initDb)(db);
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID ?? client.user.id;
    if (token && clientId) {
        const rest = new discord_js_1.REST({ version: "10" }).setToken(token);
        const commands = [config_js_1.configCommand, ticket_js_1.ticketCommand];
        await rest.put(discord_js_1.Routes.applicationCommands(clientId), {
            body: commands,
        });
        console.log("Slash commands registered.");
    }
    setInterval(() => {
        try {
            const deleted = (0, ticketService_js_1.deleteOldClosedTickets)(TICKET_RETENTION_DAYS);
            if (deleted > 0)
                console.log(`Cleaned up ${deleted} old ticket(s).`);
        }
        catch (e) {
            console.error("Ticket cleanup error:", e);
        }
    }, 24 * 60 * 60 * 1000);
    console.log(`Logged in as ${client.user.tag}`);
}
