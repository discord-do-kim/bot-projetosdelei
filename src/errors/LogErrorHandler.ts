import { ErrorHandler } from "./ErrorHandler";
import { LOG_WEBHOOK } from "../config";
import { EmbedBuilder, DiscordAPIError, DiscordjsError } from "discord.js";
import axios from "axios";
export class LogErrorHandler extends ErrorHandler {
  async handle(error: Error) {
    try {
      const embed = new EmbedBuilder();

      if (error instanceof DiscordAPIError) {
        Object.entries(error).forEach(([name, value]) => {
          embed.setFields([{ name, value: JSON.stringify(value) }]);
        });
      }

      if (error instanceof DiscordjsError) {
        Object.entries(error).forEach(([name, value]) => {
          embed.setFields([{ name, value: JSON.stringify(value) }]);
        });
      }

      embed.setTitle(error.name);
      embed.setDescription(error.stack);
      embed.setTimestamp(new Date());

      await axios.post(LOG_WEBHOOK, { embeds: [embed.toJSON()] });
    } catch (e) {
      console.log(e);
    } finally {
      super.handle(error);
    }
  }
}
