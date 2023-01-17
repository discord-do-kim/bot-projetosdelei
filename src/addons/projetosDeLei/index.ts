import { commandHandler } from "../../commands/CommandHandler";
import { clientReadyHandler } from "../../handlers/ClientReadyHandler";
import { randomUUID } from "crypto";
import { ProjectsCommand } from "./ProjectsCommand";
import { sendEmbeds } from "./sendEmbeds";
import { interactionEventHandler } from "../../handlers/InteractionEventHandler";
import { InteractionType } from "discord.js";
import { createNewProjetoDeLei } from "./createNewProjetoDeLei";
import { handleAcceptProject } from "./handleAcceptProject";
import { handleRejectProject } from "./handleRejectProject";

export default () => {
  commandHandler.register(new ProjectsCommand());
  clientReadyHandler.register(randomUUID(), sendEmbeds);

  interactionEventHandler.register(
    InteractionType.MessageComponent,
    createNewProjetoDeLei
  );

  interactionEventHandler.register(
    InteractionType.MessageComponent,
    handleAcceptProject
  );

  interactionEventHandler.register(
    InteractionType.MessageComponent,
    handleRejectProject
  );
};
