import { SlashCommandBuilder } from "discord.js";

export abstract class CommandHandler {
  readonly command:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

  get name() {
    return this.command.name;
  }

  get description() {
    return this.command.description;
  }

  async execute(...args: any[]): Promise<any> {
    return new Promise((resolve) => resolve(args));
  }
}
