import { commandHandler } from "../../commands/CommandHandler";
import { clientReadyHandler } from "../../handlers/ClientReadyHandler";
import { interactionEventHandler } from "../../handlers/InteractionEventHandler";
import { InteractionType } from "discord.js";
import { VoiceMod } from "./voiceMod";

export default (): void => {
  commandHandler.register(new VoiceMod());
};
