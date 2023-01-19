import { randomUUID } from "crypto";
import { Client, Events } from "discord.js";
import { EventHandler } from "./EventHandler";

type Handler = (client: Client, ...args: any[]) => Promise<any>;

class ClientReadyHandler extends EventHandler {
  readonly handlers: Map<string, Handler> = new Map();

  public register(id: string, handler: Handler): void {
    this.handlers.set(id, handler);
  }

  public async handle(client: Client, ...args: any[]): Promise<any> {
    await Promise.all(
      Array.from(this.handlers.values()).map(
        async (handler) => await handler(client, ...args)
      )
    );

    client.removeAllListeners(Events.ClientReady);
  }
}

export const clientReadyHandler = new ClientReadyHandler();

clientReadyHandler.register(randomUUID(), async (client) => {
  if (client.user !== null) console.log(`Logged in ${client.user.tag}`);
});
