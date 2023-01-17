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
import { supportButton } from "../../utils/supportButton";
import { config } from "./config";

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

    if (project.meta.status !== "pending") {
      await interaction.reply({
        content: `Esse já foi tratado e contém o status de ${project.meta.status}`,
        ephemeral: true,
      });

      const message = await interaction.message.fetch();

      message.edit({ components: [] });

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
        embed.setColor(Colors.Red);
        await modal.deferReply({ ephemeral: true });

        const rejectReason = modal.fields.getTextInputValue(
          config.customIds.rejectReason
        );

        const rejectedProject = await project.updateOne(
          {
            meta: {
              moderator: interaction.user.id,
              status: "rejected",
              rejectReason: rejectReason,
              handledAt: new Date(),
            },
          },
          { new: true }
        );

        const rejectEmbed = new EmbedBuilder({
          title: "Motivo da Rejeição:",
          description: rejectReason,
          footer: {
            icon_url: modal.user.avatarURL(),
            text: "Rejeitado por @" + modal.user.username,
          },
          color: Colors.Red,
          timestamp: rejectedProject.meta?.handledAt,
        });

        await message.edit({
          embeds: [embed, rejectEmbed],
          components: [],
        });

        try {
          await interaction.user.send({
            content: `Seu projeto "${project.title}" foi rejeitado.`,
            embeds: [
              new EmbedBuilder({
                ...embed.toJSON(),
                footer: undefined,
                author: undefined,
              }),
              rejectEmbed,
            ],
          });

          const buttons = new ActionRowBuilder<ButtonBuilder>({
            components: [
              supportButton,
              new ButtonBuilder({
                style: ButtonStyle.Link,
                label: "Faq Projetos de Lei",
                url: interaction.channel.url,
              }),
            ],
          });

          await interaction.user.send({
            content:
              "Se precisar de mais informações, clique nos botões abaixo:",
            components: [buttons],
          });
        } catch (e) {
          message.edit({
            embeds: [
              embed,
              rejectEmbed,
              new EmbedBuilder({
                footer: {
                  iconURL: interaction.user.avatarURL(),
                  text: "Não foi possível notificar o usuário no privado.",
                },
                color: Colors.Red,
                timestamp: new Date(),
              }),
            ],
          });
        }

        await modal.followUp("Processo concluído.");
      } catch (e) {
        await fetchError(e);
        await modal.followUp({
          content: "Um erro aconteceu, não foi possível completar a ação",
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
