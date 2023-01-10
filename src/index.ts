import { DISCORD_TOKEN } from "./config";
import { client } from "./client";
import scripts from "./scripts";
import { Events } from "discord.js";

(async () => {
  client.once(Events.ClientReady, (client) => {
    console.log(`Logged in ${client.user.tag}`);
    scripts.forEach((script) => {
      script.client = client;
      script.run();
    });
  });
  await client.login(DISCORD_TOKEN);
})();
