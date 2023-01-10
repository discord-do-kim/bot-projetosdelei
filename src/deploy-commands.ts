import { REST, Routes } from "discord.js";
import { DISCORD_CLIENT_ID, DISCORD_TOKEN } from "./config";

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    const data: any = await rest.put(
      Routes.applicationCommands(DISCORD_CLIENT_ID),
      { body: [] }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (e) {
    console.error(e);
  }
})();
