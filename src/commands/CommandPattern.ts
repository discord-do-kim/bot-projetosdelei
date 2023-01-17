/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ContextMenuCommandBuilder,
  Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { client } from "../client";

type Slash =
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

      return;
    }
  }

  get name() {
    return this.command.name;
  }

  get description() {
    if (this.command instanceof ContextMenuCommandBuilder) {
      return this.command.name;
    }
    return this.command.description;
  }

  async onwer() {
    await client.application.fetch();
    const user = await client.users.fetch(client.application.owner.id);

    return user;
  }
}
