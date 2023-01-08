import { Client, Events } from "discord.js";
import { EventHandler } from "./EventHandler";

export class ClientReadyEvent implements EventHandler {
  public readonly eventType = Events.ClientReady;

  public readonly listenerType = "once";

  async handleEvent(client: Client) {
    console.log(`Ready! Log in as ${client.user.tag}`);
  }
}
