import { DiscordAPIError, CommandInteraction } from "discord.js";
import { ErrorHandler } from "./ErrorHandler";

export class ChatInputCommandError extends ErrorHandler {
  constructor(private interaction: CommandInteraction) {
    super();
  }
  async handle(error: Error) {
    if (!(error instanceof DiscordAPIError)) {
      return super.handle(error);
    }
    switch (error.code) {
      case 50001:
        await this.interaction.followUp({
          content: "Eu não tenho permissão para isso neste canal.",
          ephemeral: true,
        });
        break;
      default:
        await this.interaction.followUp({
          content: "Eu não tenho permissão para isso neste canal.",
          ephemeral: true,
        });
        break;
    }
  }
}
