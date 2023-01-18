import { ButtonInteraction, Colors, EmbedBuilder } from "discord.js";
import { client } from "../../client";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { StatusColors } from "./enums/Status";
import { openThread } from "./openThread";
import { Components } from "./Components";

export async function updateOutdatedEmbed(
  interaction: ButtonInteraction,
  projectId: string
) {
  const project = await ProjetoDeLeiModel.findById(projectId);

  const thread = await openThread(projectId);

  const responseComponents = await Components.handleProjectByStatus(project);

  responseComponents["components"].push(
    Components.openChannel("Acompanhe o seu projeto de lei.", thread as any)
  );

  await interaction.message.edit(responseComponents);
}
