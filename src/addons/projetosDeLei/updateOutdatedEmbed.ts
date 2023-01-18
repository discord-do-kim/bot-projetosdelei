import { ButtonInteraction, Colors, EmbedBuilder } from "discord.js";
import { client } from "../../client";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { StatusColors } from "./enums/Status";
import { openThread } from "./openThread";
import { Buttons } from "../../utils/Buttons";
import { Embeds } from "./Components";

export async function updateOutdatedEmbed(
  interaction: ButtonInteraction,
  projectId: string
) {
  const project = await ProjetoDeLeiModel.findById(projectId);

  const userOwner = await client.users.fetch(project.userId);

  const mod = await client.users.fetch(project.meta.moderator);

  const message = await interaction.message.fetch();

  const embed = new EmbedBuilder(message.embeds[0]).setColor(
    StatusColors[project.meta.status]
  );

  let statusEmbed: EmbedBuilder;

  if (project.meta.status === "accepted") {
    statusEmbed = Embeds.acceptedByEmbed(mod, project.meta.handledAt);
  }

  if (project.meta.status === "rejected") {
    statusEmbed = Embeds.rejectedByEmbed(
      project.meta.rejectReason,
      mod,
      project.meta.handledAt
    );
  }

  const notNotifiedEmbed = new EmbedBuilder({
    color: Colors.Yellow,
    footer: {
      text: "Não foi possível notificar o usuário no privado.",
      iconURL: userOwner.avatarURL(),
    },
    timestamp: project.meta.handledAt,
  });

  if (project.meta.status === "rejected") {
    statusEmbed
      .setTitle("Motivo da Rejeição")
      .setDescription(project.meta.rejectReason);
  }

  const thread = await openThread(projectId);

  await message.edit({
    embeds: [
      embed,
      statusEmbed,
      !project.meta.notified ? notNotifiedEmbed : undefined,
    ],
    components: [Buttons.openProject(thread)],
  });
}
