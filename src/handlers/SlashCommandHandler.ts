import { CommandInteraction } from "discord.js";
import { Handler } from "./Handler";
import { client } from "..";
import { ChatInputCommandError } from "../errors/ChatInputCommandError";

export class SlashCommandHandler extends Handler {
  async handle(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) {
      return super.handle(interaction);
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) throw new Error("Command Not Found");

    await command.execute(interaction).catch((e) => console.log(e));
  }
}
