import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import { CommandHandler } from "./CommandHandler";

export class PingHandler extends CommandHandler {
  public readonly command = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies With Pong!");

  public async execute(interaction: CommandInteraction) {
    await interaction.reply("Pong");
  }
}
