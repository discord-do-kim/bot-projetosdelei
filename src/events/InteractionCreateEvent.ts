import { CacheType, CommandInteraction, Events } from "discord.js";
import { EventHandler } from "./EventHandler";
import { SlashCommandHandler } from "../handlers/SlashCommandHandler";
import { ChatInputCommandError } from "../errors/ChatInputCommandError";
import { LogErrorHandler } from "../errors/LogErrorHandler";
import { InteractionError } from "../errors/InteractionError";

export class InteractionCreateEvent implements EventHandler {
  public readonly eventType = Events.InteractionCreate;

  public readonly listenerType = "on";

  async handleEvent(interaction: CommandInteraction<CacheType>) {
    try {
      const chatInputHandler = new SlashCommandHandler();
      await chatInputHandler.handle(interaction).catch(console.error);
    } catch (e) {
      const logErrorHandler = new LogErrorHandler();
      const chatInputCommandError = new ChatInputCommandError(interaction);
      const interactionError = new InteractionError();

      logErrorHandler.setNext(chatInputCommandError);
      chatInputCommandError.setNext(interactionError);

      await logErrorHandler.handle(e);
    }
  }
}
