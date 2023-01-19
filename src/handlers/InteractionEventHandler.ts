import { Interaction, InteractionType } from "discord.js";
import { commandHandler } from "../commands/CommandHandler";
import { fetchError } from "../utils/fetchError";
import { EventHandler } from "./EventHandler";

type Handler = (interaction: Interaction, ...args: any[]) => Promise<any>;

class InteractionEventHandler extends EventHandler {
  readonly handlers: Map<InteractionType, Set<Handler>> = new Map();

  public register(eventType: InteractionType, handler: Handler): void {
    const handlers = this.handlers.get(eventType);

    if (handlers == null) {
      this.handlers.set(eventType, new Set([handler]));
      return;
    }

    handlers.add(handler);
  }

  public async handle(interaction: Interaction, ...args: any[]): Promise<void> {
    try {
      const type = interaction.type;
      const handlers = this.handlers.get(type);

      if (handlers != null) {
        for (const handler of handlers) {
          await handler(interaction, ...args);
        }
      }
    } catch (e) {
      if (!interaction.isRepliable()) return;

      await interaction
        .reply({
          ephemeral: true,
          content: `${e as string}`,
        })
        .catch(
          async () =>
            await interaction.followUp({
              ephemeral: true,
              content: `${e as string}`,
            })
        )
        .catch(async () => {
          await fetchError(e);
        });
    }
  }
}

export const interactionEventHandler = new InteractionEventHandler();

interactionEventHandler.register(
  InteractionType.ApplicationCommand,
  commandHandler.handle.bind(commandHandler)
);
