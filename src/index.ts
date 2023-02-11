import { DISCORD_TOKEN, MONGO_SRV } from "./config";
import { client } from "./client";
import mongoose from "mongoose";
import { eventDispatcher } from "./dispatcher/EventDispatcher";
import projetosDeLei from "./addons/projetosDeLei";
import cronometro  from "./addons/cronometro";

projetosDeLei();
cronometro();


(async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGO_SRV);

  eventDispatcher.events.forEach((event) => {
    client.on(event as string, async (...args) => {
      await eventDispatcher.dispatchEvent(event, ...args);
    });
  });

  await client.login(DISCORD_TOKEN);
})().catch((e) => {
  console.log(e);
});
