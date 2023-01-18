import {
  Interaction,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextInputBuilder,
  ComponentType,
  TextInputStyle,
  ModalBuilder,
  InteractionType,
  InteractionCollector,
  ModalSubmitInteraction,
} from "discord.js";
import { Error } from "mongoose";
import { client } from "../../client";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { fetchError } from "../../utils/fetchError";
import { Buttons } from "../../utils/Buttons";
import { config } from "./config";
import { updateOutdatedEmbed } from "./updateOutdatedEmbed";
import { Components } from "./Components";

export async function handleRejectProject(interaction: Interaction) {
  if (!interaction.isButton()) return;
  const customId = interaction.customId;
  const rejectId = config.customIds.rejectButton;
  if (customId !== rejectId) return;

  const message = await interaction.message.fetch();
  const embed = new EmbedBuilder(message.embeds[0]);

  try {
    const projectId = embed.toJSON().footer?.text;

    const project = await ProjetoDeLeiModel.findById(projectId);

    if (!project) {
      await interaction.reply({
        content: "Esse projeto não existe na base de dados.",
      });

      return;
    }

    const userOwner = await client.users.fetch(project.userId);

    if (project.meta.status !== "pending") {
      await interaction.reply({
        content: `Esse já foi tratado e contém o status de ${project.meta.status}.`,
        ephemeral: true,
      });

      await updateOutdatedEmbed(interaction, projectId);
      return;
    }

    const rejectReason = new ActionRowBuilder<TextInputBuilder>({
      components: [
        {
          type: ComponentType.TextInput,
          customId: config.customIds.rejectReason,
          required: true,
          style: TextInputStyle.Paragraph,
          label: "Descreva aqui o por quê.",
          value:
            "O seu projeto ou fere as diretrizes legais pré-estabelecidas, ou o seu projeto está fora dos conformes, de acordo com o tutorial exposto no canal de projetos-de-lei. Por favor, peço dê uma olhada antes de enviar o seu PL.",
        },
      ],
    });

    const modal = new ModalBuilder({
      customId: config.customIds.rejectForm,
      title: "Por que você rejeitou?",
      components: [rejectReason],
    });

    await interaction.showModal(modal);

    const collector = new InteractionCollector(client, {
      filter: (modal) => modal.user.id === interaction.user.id,
      interactionType: InteractionType.ModalSubmit,
    });

    collector.on("collect", async (modal: ModalSubmitInteraction) => {
      try {
        if (!modal.isModalSubmit()) return;
        await modal.deferReply({ ephemeral: true });

        const rejectReason = modal.fields.getTextInputValue(
          config.customIds.rejectReason
        );

        const rejectedProject = await ProjetoDeLeiModel.findByIdAndUpdate(
          { _id: projectId },
          {
            "meta.moderador": interaction.user.id,
            "meta.status": "rejected",
            "meta.rejectReason": rejectReason,
            "meta.handledAt": new Date(),
          },
          { returnDocument: "after" }
        );

        const responseComponents = await Components.rejectedComponents(
          rejectedProject
        );

        await message.edit(responseComponents);

        try {
          await userOwner.send({
            content: `Seu projeto "${project.title}" foi rejeitado.`,
            embeds: [
              new EmbedBuilder({
                ...embed.toJSON(),
                footer: undefined,
                author: undefined,
              }),
              ...responseComponents.embeds.splice(0, 2),
            ],
          });

          rejectedProject.updateOne({ "meta.notified": true });

          const buttons = new ActionRowBuilder<ButtonBuilder>({
            components: [
              new ButtonBuilder({
                style: ButtonStyle.Link,
                label: "Faq Projetos de Lei",
                url: interaction.channel.url,
              }),
            ],
          });

          await userOwner.send({
            content:
              "Se precisar de mais informações, clique nos botões abaixo:",
            components: [buttons, Buttons.support()],
          });
        } catch (e) {
          message.edit(responseComponents);
        }

        await modal.followUp({
          content: "Processo concluído.",
          ephemeral: true,
        });
      } catch (e) {
        await fetchError(e);
        await modal.followUp({
          content:
            "Um erro aconteceu, não foi possível completar a ação:\n" +
            e.toString(),
          ephemeral: true,
        });
      }

      collector.stop();
    });
  } catch (e) {
    if (e instanceof Error.CastError) {
      await interaction.reply({
        content: `O id "${embed.data.footer.text}" é inválido.`,
        ephemeral: true,
      });
      return;
    }
    await interaction.followUp({
      content: `Não foi possível aceitar essa sugestão. Um erro aconteceu: ${e.toString()}. `,
      ephemeral: true,
    });
  }
}
