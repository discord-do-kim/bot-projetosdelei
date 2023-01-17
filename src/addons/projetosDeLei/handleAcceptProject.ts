import {
  ChannelType,
  Interaction,
  ThreadAutoArchiveDuration,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { client } from "../../client";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { fetchError } from "../../utils/fetchError";
import { config } from "./config";

export async function handleAcceptProject(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;
  const aprovedButtonId = config.customIds.aprovedButton;
  if (customId !== aprovedButtonId) return;
  await interaction.deferReply({ ephemeral: true });

  const message = await interaction.message.fetch();
  const embed = new EmbedBuilder(message.embeds[0]);
  const projectId = embed.toJSON().footer?.text;
  const channel = await client.channels.cache
    .get(config.send_channel)
    .fetch()
    .catch(async (e) => {
      interaction.followUp(
        "Não foi possível buscar o canal de criação de threads."
      );
      throw e;
    });

  try {
    const project = await ProjetoDeLeiModel.findById(projectId).catch(
      async (e) => {
        await interaction.followUp(
          "Não foi possível atualizar o banco de dados."
        );
        throw e;
      }
    );
    await project.updateOne(
      {
        meta: {
          moderator: interaction.user.id,
          status: "accepted",
          handledAt: new Date(),
        },
      },
      { new: true }
    );


    if (
      !channel.isTextBased() ||
      channel.isDMBased() ||
      channel.isVoiceBased() ||
      channel.isThread()
    ) {
      await interaction.followUp(
        "O canal para abrir threads não é um canal de texto."
      );
      throw new Error();
    }

    const thread = await channel.threads
      .create({
        name: embed.toJSON().title,
        reason: "Novo projeto de lei",
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        invitable: false as never,
        type: ChannelType.PrivateThread as never,
      })
      .catch(async (e) => {
        await interaction.followUp(
          "Não foi possível criar uma thread privada, você terá que cria-lá manualmente."
        );
        throw e;
      });

    const projectMessage = await thread
      .send({
        content: `Projeto de lei sugerido por: ${interaction.user}.`,
        embeds: [
          new EmbedBuilder({
            title: project.title,
            description: project.content,
          }),
        ],
      })
      .catch(() =>
        interaction.followUp(
          `Consegui criar a thread, mas não consegui enviar o projeto de lei. Você terá que enviar manualmente no canal ${thread}.`
        )
      );

    await thread.members.add(interaction.user).catch();

    const responsible = await projectMessage
      .reply({
        content: `Responsável pela fiscalização do canal: ${interaction.user}`,
      })
      .catch(async () =>
        interaction.followUp(
          `Não foi possível te adicionar a thread automaticamente. Você pode entrar por aqui ${thread}.`
        )
      );

    await responsible.delete().catch();

    await projectMessage
      .reply({
        content: `Projeto de lei sugerido para você, <@${config.mention_user}>!`,
      })
      .catch(() =>
        interaction.followUp(
          `Não foi possível mencionar o <@${config.mention_user}> na thread. Você terá que mencioná-lo manualmente.`
        )
      );

    const acceptEmbed = new EmbedBuilder({
      footer: {
        iconURL: interaction.user.avatarURL({
          size: 32,
        }),
        text: `Aprovado por @${interaction.user.username}`,
      },
      timestamp: new Date(),
      color: Colors.Green,
    });

    embed.setColor(Colors.Green);

    await message.edit({
      embeds: [embed, acceptEmbed],
      components: [],
    });

    try {
      await interaction.user.send({
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
      });
    } catch (e) {
      const alertEmbed = new EmbedBuilder({
        footer: {
          iconURL: interaction.user.avatarURL(),
          text: "Não foi possível avisar o usuário no privado.",
        },
        color: Colors.Yellow,
        timestamp: new Date(),
      });

      await message.edit({
        embeds: [embed, acceptEmbed, alertEmbed],
      });
    }

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
