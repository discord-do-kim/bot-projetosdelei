import {
  Interaction,
  EmbedBuilder,
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
  Colors,
} from "discord.js";
import { Error } from "mongoose";
import { client } from "../../client";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { fetchError } from "../../utils/fetchError";
import { config } from "./config";
import { Status } from "./enums/Status";
import { isNotifiedEmbed, projetoEmbed, rejectedProjetoEmbed } from "./utils";
import { supportButton } from "../../utils/Buttons";

export async function handleRejectProject(
  interaction: Interaction
): Promise<void> {
  if (!interaction.isButton()) return;
  const customId = interaction.customId;
  const rejectId = config.customIds.rejectButton;
  if (customId !== rejectId) return;

  let message = await interaction.message.fetch();
  const projetoId = message.embeds[0].footer?.text;

  if (projetoId === undefined) {
    throw new Error(
      "Não foi possível encontrar o ID do projeto nessa mensagem."
    );
  }

  const projeto = await ProjetoDeLeiModel.findById(projetoId);

  if (projeto === null) {
    throw new Error(
      `Não foi possível encontrar o projeto com o ID ${projetoId}.`
    );
  }

  const status = projeto.meta.status;

  if (status !== "pending") {
    const status = Status[projeto.meta.status];

    await interaction.reply({
      content: `Esse já foi tratado e contém o status de ${status}.`,
      ephemeral: true,
    });

    await interaction.followUp({
      content: `Para ver mais detalhes, digite "/projetos id ${projetoId}".`,
      ephemeral: true,
    });

    const embed = new EmbedBuilder(message.embeds[0].toJSON()).setColor(
      Colors.Yellow
    );

    await message.edit({
      embeds: [embed],
      components: [],
    });

    return;
  }

  try {
    const owner = await client.users.fetch(projeto.owner);

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
      const session = await ProjetoDeLeiModel.startSession();
      session.startTransaction();
      try {
        if (!modal.isModalSubmit()) return;
        await modal.deferReply({ ephemeral: true });

        const rejectReason = modal.fields.getTextInputValue(
          config.customIds.rejectReason
        );

        const rejectedProjeto = await ProjetoDeLeiModel.findByIdAndUpdate(
          { _id: projetoId },
          {
            "meta.moderatorId": interaction.user.id,
            "meta.status": "rejected",
            "meta.rejectReason": rejectReason,
            "meta.handledAt": new Date(),
          },
          { new: true }
        );

        if (rejectedProjeto === null) {
          await session.abortTransaction();
          await session.endSession();

          await modal.editReply(
            "Alguma coisa deu errado na atualização do projeto. Tente novamente."
          );

          return;
        }

        const rejectedEmbed = await rejectedProjetoEmbed(rejectedProjeto);
        const embed = await projetoEmbed(rejectedProjeto);

        message = await message.edit({
          embeds: [embed, rejectedEmbed],
          components: [],
        });

        await owner
          .send({
            content: `Seu projeto "${rejectedProjeto.title}" foi rejeitado.`,
            embeds: [
              new EmbedBuilder({
                title: rejectedProjeto.title,
                description: rejectedProjeto.content,
                timestamp: rejectedProjeto.meta.handledAt?.toString(),
                footer: {
                  text: rejectedProjeto._id.toString(),
                },
              }),
            ],
          })
          .then(async (message) => {
            const faq = await client.channels.fetch(config.send_channel);

            const buttons = new ActionRowBuilder<ButtonBuilder>({
              components: [supportButton],
            });

            if (faq !== null) {
              buttons.addComponents(
                new ButtonBuilder({
                  style: ButtonStyle.Link,
                  label: "Faq Projetos de Lei",
                  url: faq.url,
                })
              );
            }

            await message.reply({
              content:
                "Se precisar de mais informações, clique nos botões abaixo:",
              components: [buttons],
            });

            rejectedProjeto.meta.ownerNotified = true;
          })
          .catch((e) => {
            rejectedProjeto.meta.ownerNotified = false;
          });

        const projeto = await rejectedProjeto.save();

        message = await message.edit({
          embeds: [embed, rejectedEmbed, isNotifiedEmbed(projeto)],
          components: [],
        });

        await modal.followUp({
          content: "Processo concluído.",
          ephemeral: true,
        });

        await session.commitTransaction();
        await session.endSession();
      } catch (e) {
        await session.abortTransaction();
        await session.endSession();

        await fetchError(e);
        if (e instanceof Error) {
          await modal.followUp({
            content: e.message,
            ephemeral: true,
          });
        } else {
          await modal.followUp({
            content: "Alguma coisa deu errado.",
            ephemeral: true,
          });
        }
      }

      collector.stop();
    });
  } catch (e) {
    await fetchError(e);
    await interaction.followUp({
      content: `Não foi possível aceitar essa sugestão. Um erro aconteceu.`,
      ephemeral: true,
    });
  }
}
