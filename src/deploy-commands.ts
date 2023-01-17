import { REST, Routes } from "discord.js";
import { DISCORD_CLIENT_ID, DISCORD_TOKEN } from "./config";
import commands from "./commands";

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data: any = await rest.put(
      Routes.applicationCommands(DISCORD_CLIENT_ID),

      {
        body: commands.map((command) => command.command.toJSON()),
      }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (e) {
    console.error(e);
  }
})();
