import {
  ContextMenuCommandBuilder,
  Interaction,
  InteractionType,
} from "discord.js";
import { fetchError } from "../utils/fetchError";
import { CommandPattern, Slash } from "./CommandPattern";
import commands from ".";

type HandlerFunction = (
  interaction: Interaction,
  ...args: any[]
) => Promise<any>;

class CommandHandler {
  private readonly _installed = new Set<CommandPattern>();
  private readonly _commands = new Map<string, HandlerFunction>();

  register(command: CommandPattern): void {
    this._installed.add(command);
    this._commands.set(command.name, command.execute.bind(command));
  }

  async handle(interaction: Interaction, ...args: any[]): Promise<void> {
    try {
      if (interaction.type !== InteractionType.ApplicationCommand) return;

      const commandName = interaction.commandName;
      const handler = this._commands.get(commandName);
      if (handler != null) await handler(interaction, ...args);
    } catch (e) {
      await fetchError(e);
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

  get command(): Array<Slash | ContextMenuCommandBuilder> {
    return Array.from(this._installed).map((instance) => instance.command);
  }

  get installed(): CommandPattern[] {
    return Array.from(this._installed);
  }
}

export const commandHandler = new CommandHandler();

commands.forEach((command) => {
  commandHandler.register(command);
});
