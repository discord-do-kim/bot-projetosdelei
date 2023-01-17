import { randomUUID } from "crypto";
import { Client, Events } from "discord.js";
import { EventHandler } from "./EventHandler";

type Handler = (client: Client, ...args: any[]) => Promise<any>;

class ClientReadyHandler extends EventHandler {
  readonly handlers: Map<string, Handler> = new Map();

  public register(id: string, handler: Handler) {
    this.handlers.set(id, handler);
  }

  public async handle(client: Client, ...args: any[]) {
    await Promise.all(
      Array.from(this.handlers.values()).map((handler) =>
        handler(client, ...args)
      )
    );

    client.removeAllListeners(Events.ClientReady);
  }
}

export const clientReadyHandler = new ClientReadyHandler();

clientReadyHandler.register(randomUUID(), async (client) => {
  console.log(`Logged in ${client.user.tag}`);
});
