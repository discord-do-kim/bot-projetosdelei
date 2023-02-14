import {
  ContextMenuCommandBuilder,
  Interaction,
  SlashCommandBuilder,
} from "discord.js";

export type Slash =
  | SlashCommandBuilder
  | Omit<
      SlashCommandBuilder,
      | "addBooleanOption"
      | "addUserOption"
      | "addChannelOption"
      | "addRoleOption"
      | "addAttachmentOption"
      | "addMentionableOption"
      | "addStringOption"
      | "addIntegerOption"
      | "addNumberOption"
      | "addSubcommandGroup"
      | "addSubcommand"
      | "_sharedAddOptionMethod"
    >;

export abstract class CommandPattern {
  abstract command: Slash | ContextMenuCommandBuilder;

  async execute(interaction: Interaction, ...args: any[]): Promise<any> {
    if (interaction.isChatInputCommand()) {
      await interaction.reply({
        ephemeral: true,
        content: "Interação não implementada.",
      });

      return;
    }

    if (interaction.isContextMenuCommand()) {
      await interaction.reply({
        ephemeral: true,
        content: "Interação não implementada.",
      });
    }
  }

  get name(): string {
    return this.command.name;
  }

  get description(): string {
    if (this.command instanceof ContextMenuCommandBuilder) {
      return this.command.name;
    }
    return this.command.description;
  }
}