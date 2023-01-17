import { DISCORD_TOKEN, MONGO_SRV } from "./config";
import { client } from "./client";
import mongoose from "mongoose";
import { eventDispatcher } from "./dispatcher/EventDispatcher";
import projetosDeLei from "./addons/projetosDeLei";

projetosDeLei();

(async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGO_SRV);

  eventDispatcher.events.map((event) => {
    client.on(event as string, (...args) => {
      eventDispatcher.dispatchEvent(event, ...args);
    });
  });

  await client.login(DISCORD_TOKEN);
})();
