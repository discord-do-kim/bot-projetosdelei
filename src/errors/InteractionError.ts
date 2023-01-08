import { DiscordAPIError } from "discord.js";
import { ErrorHandler } from "./ErrorHandler";

export class InteractionError extends ErrorHandler {
  handle(error: Error) {
    if (!(error instanceof DiscordAPIError)) {
      return super.handle(error);
    }
    console.log(error.code, error.message, error.method);
  }
}
