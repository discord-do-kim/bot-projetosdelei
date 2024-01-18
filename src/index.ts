import { DISCORD_TOKEN, MONGO_SRV } from "./config";
import { client } from "./client";
import mongoose from "mongoose";
import { eventDispatcher } from "./dispatcher/EventDispatcher";
import projetosDeLei from "./addons/projetosDeLei";
import { Events } from "discord.js";

projetosDeLei();

(async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGO_SRV);

  eventDispatcher.events.forEach((event) => {
    client.on(event as string, async (...args) => {
      await eventDispatcher.dispatchEvent(event, ...args);
    });
  });

  client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });
  await client.login(DISCORD_TOKEN);
})().catch((e) => {
  console.log(e);
});
