import { Client as ApiClient, Collection } from "discord.js";
import { CommandHandler } from "./commands/CommandHandler";

export class Client extends ApiClient {
  public commands: Collection<string, CommandHandler>;
}
