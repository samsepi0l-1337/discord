import type { Client } from "discord.js";
import { REST, Routes } from "discord.js";
import { getDb, initDb } from "../config/database.js";
import { configCommand } from "../commands/config.js";
import { ticketCommand } from "../commands/ticket.js";
import { deleteOldClosedTickets } from "../services/ticketService.js";
import fs from "fs";
import path from "path";

const TICKET_RETENTION_DAYS = parseInt(
  process.env.TICKET_RETENTION_DAYS ?? "30",
  10,
);

export async function handleReady(client: Client<true>): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const db = getDb();
  initDb(db);

  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID ?? client.user.id;
  if (token && clientId) {
    const rest = new REST({ version: "10" }).setToken(token);
    const commands = [configCommand, ticketCommand];
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });
    console.log("Slash commands registered.");
  }

  setInterval(
    () => {
      try {
        const deleted = deleteOldClosedTickets(TICKET_RETENTION_DAYS);
        if (deleted > 0) console.log(`Cleaned up ${deleted} old ticket(s).`);
      } catch (e) {
        console.error("Ticket cleanup error:", e);
      }
    },
    24 * 60 * 60 * 1000,
  );

  console.log(`Logged in as ${client.user.tag}`);
}
