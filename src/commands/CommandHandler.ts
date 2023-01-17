import { Interaction, InteractionType } from "discord.js";
import { fetchError } from "../utils/fetchError";
import { CommandPattern } from "./CommandPattern";

type HandlerFunction = (
  interaction: Interaction,
  ...args: any[]
) => Promise<any>;

class CommandHandler {
  private _installed = new Set<CommandPattern>();
  private _commands = new Map<string, HandlerFunction>();

  register(command: CommandPattern) {
    this._installed.add(command);
    this._commands.set(command.name, command.execute.bind(command));
  }

  async handle(interaction: Interaction, ...args: any[]) {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const commandName = interaction.commandName;
    const handler = this._commands.get(commandName);
    try {
      if (handler) await handler(interaction, ...args);
    } catch (e) {
      try {
        await interaction.followUp({
          ephemeral: true,
          content: "Um erro aconteceu. " + e.toString(),
        });
      } catch (e) {
        await interaction
          .reply({
            ephemeral: true,
            content: "Um erro aconteceu. " + e.toString(),
          })
          .catch(fetchError);
      }
    }
  }

  get command() {
    return Array.from(this._installed).map((instance) => instance.command);
  }

  get installed(): CommandPattern[] {
    return Array.from(this._installed);
  }
}

export const commandHandler = new CommandHandler();
