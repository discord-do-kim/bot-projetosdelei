import { Interaction, InteractionType } from "discord.js";
import { commandHandler } from "../commands/CommandHandler";
import { fetchError } from "../utils/fetchError";
import { EventHandler } from "./EventHandler";

type Handler = (interaction: Interaction, ...args: any[]) => Promise<any>;

class InteractionEventHandler extends EventHandler {
  readonly handlers: Map<InteractionType, Set<Handler>> = new Map();

  public register(eventType: InteractionType, handler: Handler) {
    const handlers = this.handlers.get(eventType);

    if (!handlers) {
      this.handlers.set(eventType, new Set([handler]));
      return;
    }

    handlers.add(handler);
  }

  public async handle(interaction: Interaction, ...args: any[]) {
    const type = interaction.type;
    const handlers = this.handlers.get(type);
    if (handlers)
      for (const handler of handlers) {
        try {
          await handler(interaction, ...args);
        } catch (e) {
          await fetchError(e);
          if (interaction.isAutocomplete()) return;
          try {
            await interaction.reply({ ephemeral: true, content: e.toString() });
          } catch (e) {
            await interaction
              .followUp({ ephemeral: true, content: e.toString() })
              .catch();
          }
        }
      }
  }
}

export const interactionEventHandler = new InteractionEventHandler();

interactionEventHandler.register(
  InteractionType.ApplicationCommand,
  commandHandler.handle.bind(commandHandler)
);
