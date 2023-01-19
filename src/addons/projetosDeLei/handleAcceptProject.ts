import {
  Interaction,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ThreadAutoArchiveDuration,
  ChannelType,
  Message,
} from "discord.js";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { Status } from "./enums/Status";
import { config } from "./config";
import { acceptedProjetoEmbed, isNotifiedEmbed, projetoEmbed } from "./utils";
import { isTextChannel } from "../../utils/isTextChannel";
import { client } from "../../client";

export async function handleAcceptProject(
  interaction: Interaction
): Promise<void> {
  if (!interaction.isButton()) return;
  const customId = interaction.customId;
  const aprovedButtonId = config.customIds.aprovedButton;
  if (customId !== aprovedButtonId) return;
  await interaction.deferReply({ ephemeral: true });

  const originalMessage = await interaction.message.fetch();

  const projetoId = originalMessage.embeds[0].footer?.text;

  if (projetoId === undefined) {
    throw new Error(
      "Não foi possível encontrar o ID do projeto nessa mensagem."
    );
  }

  let projeto = await ProjetoDeLeiModel.findById(projetoId);

  await interaction.editReply({
    content: "Projeto encontrado.",
  });

  if (projeto === null) {
    throw new Error(
      `Não foi possível encontrar o projeto com o ID ${projetoId}.`
    );
  }

  const status = projeto.meta.status;

  if (status !== "pending") {
    const status = Status[projeto.meta.status];

    await interaction.followUp({
      content: `Esse já foi tratado e contém o status de ${status}.`,
      ephemeral: true,
    });

    await interaction.followUp({
      content: `Para ver mais detalhes, digite "/projetos id ${projetoId}".`,
      ephemeral: true,
    });

    const embed = new EmbedBuilder(
      originalMessage.embeds[0]?.toJSON()
    ).setColor(Colors.Yellow);

    await originalMessage.edit({ embeds: [embed], components: [] });

    return;
  }

  const session = await ProjetoDeLeiModel.startSession();
  session.startTransaction();
  try {
    projeto.meta = {
      moderatorId: interaction.user.id,
      status: "accepted",
      handledAt: new Date(),
      ownerNotified: false,
    };

    projeto = await projeto.save();

    await interaction.editReply({
      content: "Projeto atualizado na base de dados.",
    });

    if (projeto === null) {
      await session.abortTransaction();
      await session.endSession();
      throw new Error(
        `Não foi possível fazer a atualização do projeto na base de dados. Tente novamente.`
      );
    }

    const channel = await client.channels.fetch(config.send_channel);

    if (channel === null) {
      await session.abortTransaction();
      await session.endSession();

      await interaction.followUp({
        content: "Não foi possível encontrar o canal para abrir a thread.",
        ephemeral: true,
      });

      return;
    }

    if (!isTextChannel(channel)) {
      await session.abortTransaction();
      await session.endSession();

      await interaction.followUp({
        content: "Não é possível abrir uma thread nesse canal.",
        ephemeral: true,
      });

      return;
    }

    const thread = await channel.threads.create({
      name: projeto.title,
      reason: "Novo projeto de lei",
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      invitable: false as never,
      type: ChannelType.PrivateThread as never,
    });

    const threadMessage = await thread
      .send({
        content: `Projeto de lei sugerido por: <@${projeto.owner}>.`,
        embeds: [
          new EmbedBuilder({
            title: projeto.title,
            description: projeto.content,
          }),
        ],
      })
      .catch(async (e) => {
        await interaction.editReply(
          "Não foi possível enviar o projeto de lei na thread criada. A thread será deletada."
        );
        await thread.delete();
        throw e;
      });

    await thread.members.add(interaction.user.id).catch();

    await threadMessage
      .reply({
        content: `Responsável pela fiscalização do canal: <@${interaction.user.id}>`,
      })
      .then(async (e: Message) => await e.delete())
      .catch();

    await threadMessage
      .reply({
        content: `Projeto de lei sugerido para você, <@${config.mention_user}>!`,
      })
      .catch(async (e) => {
        await interaction.editReply(
          `Não foi possível mencionar o <@${config.mention_user}>, por favor, verifique.`
        );
      });

    projeto.meta.threadId = thread.id;

    projeto = await projeto.save();

    await interaction.editReply({
      content: "Projeto enviado com sucesso!",
    });

    const acceptEmbed = await acceptedProjetoEmbed(projeto);
    const embed = await projetoEmbed(projeto);

    const openProjetoButton = new ButtonBuilder({
      url: thread.url,
      label: "Ver projeto de lei enviado.",
      style: ButtonStyle.Link,
    });

    const newMessage = await originalMessage.edit({
      embeds: [embed, acceptEmbed],
      components: [
        new ActionRowBuilder<ButtonBuilder>({
          components: [openProjetoButton],
        }),
      ],
    });

    const user = interaction.user;

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
      .then(() => {
        if (projeto === null) return;
        projeto.meta.ownerNotified = true;
      })
      .catch(() => {
        if (projeto === null) return;
        projeto.meta.ownerNotified = false;
      });

    projeto = await projeto.save();

    if (projeto === null) {
      throw new Error(
        "O projeto foi aceito, mas não tenho certeza se o dono foi notificado."
      );
    }

    const notifiedEmbed = isNotifiedEmbed(projeto);

    await newMessage.edit({
      embeds: [embed, acceptEmbed, notifiedEmbed],
    });

    await interaction.followUp({
      content: "Processo concluído.",
      ephemeral: true,
    });

    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    await session.abortTransaction();
    await session.endSession();
    await interaction.editReply({
      content: "Um erro não esperado aconteceu. O processo foi abortado.",
      embeds: [new EmbedBuilder({ description: e as string })],
    });
  }
}
