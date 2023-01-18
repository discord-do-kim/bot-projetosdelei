import {
  Interaction,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { client } from "../../client";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { fetchError } from "../../utils/fetchError";
import { Status } from "./enums/Status";
import { config } from "./config";
import { openThread } from "./openThread";
import { updateOutdatedEmbed } from "./updateOutdatedEmbed";
import { Components } from "./Components";

export async function handleAcceptProject(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;
  const aprovedButtonId = config.customIds.aprovedButton;
  if (customId !== aprovedButtonId) return;
  await interaction.deferReply({ ephemeral: true });

  const message = await interaction.message.fetch();
  const embed = new EmbedBuilder(message.embeds[0]);
  const projectId = embed.toJSON().footer?.text;

  try {
    let project = await ProjetoDeLeiModel.findById(projectId).catch(
      async (e) => {
        await interaction.followUp({
          content: "Não foi possível atualizar o banco de dados.",
          ephemeral: true,
        });
        throw e;
      }
    );

    if (project.meta.status !== "pending") {
      await updateOutdatedEmbed(interaction, projectId);
      await interaction.followUp({
        content: `Esse já foi tratado e contém o status de ${
          Status[project.meta.status]
        }`,
        ephemeral: true,
      });

      return;
    }

    project = await ProjetoDeLeiModel.findByIdAndUpdate(
      { _id: projectId },
      {
        "meta.moderator": interaction.user.id,
        "meta.status": "accepted",
        "meta.handledAt": new Date(),
      },
      { returnDocument: "after" }
    );

    const user = await client.users.fetch(project.userId);

    const thread = await openThread(projectId);

    const responseComponents = await Components.acceptedComponents(project);

    embed.setColor(Colors.Green);

    await message.edit({
      embeds: responseComponents.embeds.splice(0, 2),
      components: responseComponents.components,
    });

    await user
      .send({
        content:
          "Pode acompanhar o andamento do seu projeto clicando no botão abaixo. Por favor, não marque o Panelli. Não acelere o processo e boa sorte com a análise de seu projeto!",
        embeds: [
          new EmbedBuilder({
            title: embed.toJSON().title,
            color: Colors.Green,
            description: embed.toJSON().description,
          }),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>({
            components: [
              new ButtonBuilder({
                label: "Ver andamento do projeto.",
                style: ButtonStyle.Link,
                url: thread.url,
              }),
            ],
          }),
        ],
      })
      .catch(async (e) => {
        await message.edit(await Components.acceptedComponents(project));

        project = await project.updateOne({ "meta.notified": false });

        return e;
      });

    await interaction.followUp({
      content: "Processo concluído.",
      ephemeral: true,
    });
  } catch (e) {
    await fetchError(e);
    await interaction.followUp({
      content: `Não foi possível aceitar essa sugestão. Um erro aconteceu: ${e.toString()}. `,
      ephemeral: true,
    });
  }
}
