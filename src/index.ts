import { GatewayIntentBits, Collection, Events } from "discord.js";
import commands from "./commands";
import { DISCORD_TOKEN } from "./config";
import { Client } from "./client";
import events from "./events";
import { EventHandler } from "./events/EventHandler";
import { CommandHandler } from "./commands/CommandHandler";
import { LogErrorHandler } from "./errors/LogErrorHandler";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection<string, typeof commands[0]>(
  commands.map((command: CommandHandler) => [command.name, command])
);

(async function run() {
  try {
    events.forEach((event: EventHandler) => {
      client[event.listenerType](event.eventType, (...args) => {
        event.handleEvent(...args);
      });
    });

    await client.login(DISCORD_TOKEN);
  } catch (e) {
    new LogErrorHandler().handle;
  }
})();
