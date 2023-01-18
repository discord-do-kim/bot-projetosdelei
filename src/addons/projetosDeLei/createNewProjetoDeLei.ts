import {
  Interaction,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  ActionRowBuilder,
  InteractionCollector,
  InteractionType,
} from "discord.js";
import { Error as MongooseError } from "mongoose";
import { client } from "../../client";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { fetchError } from "../../utils/fetchError";
import { Buttons } from "../../utils/Buttons";
import { config } from "./config";
import { Components } from "./Components";

export async function createNewProjetoDeLei(interaction: Interaction) {
  if (!interaction.isButton()) return;
  if (interaction.customId !== config.customIds.suggestNewProject) return;

  const channelToVerify = await client.channels.cache
    .get(config.verify_channel)
    .fetch();

  const title = new TextInputBuilder({
    label: "Título da sugestão",
    required: true,
    maxLength: 80,
    minLength: 10,
    placeholder: "Descreva brevemente o seu projeto de lei.",
    style: TextInputStyle.Short,
    customId: config.customIds.titleField,
  });

  const content = new TextInputBuilder({
    label: "Conteúdo do seu Projeto:",
    required: true,
    placeholder:
      "Foque no conteúdo principal, para que ele não seja negado pela moderação do servidor.",
    style: TextInputStyle.Paragraph,
    customId: config.customIds.contentField,
  });

  const modal = new ModalBuilder({
    customId: config.customIds.projectForm,
    title: "Envia sua sugestão!",
    components: [
      new ActionRowBuilder<TextInputBuilder>().addComponents(title),
      new ActionRowBuilder<TextInputBuilder>().addComponents(content),
    ],
  });

  await interaction.showModal(modal);

  const collector = new InteractionCollector(client, {
    interactionType: InteractionType.ModalSubmit,
    filter: (modal) => interaction.user.id === modal.user.id,
  });

  collector.on("collect", async (modal) => {
    try {
      if (!modal.isModalSubmit()) return;

      await modal.deferReply({ ephemeral: true });

      const title = modal.fields.getTextInputValue(config.customIds.titleField);

      const content = modal.fields.getTextInputValue(
        config.customIds.contentField
      );

      const user = interaction.user;

      try {
        const projeto = await new ProjetoDeLeiModel({
          title,
          content,
          userId: user.id,
        }).save();

        const responseComponents = await Components.pendingComponents(projeto);

        await modal.followUp({
          content:
            "Seu projeto de lei foi enviado para a moderação fiscalizar. Você será notificado no privado se o seu projeto passar na fiscalização e encaminhada para assessoria do Kim.",
        });

        if (!channelToVerify.isTextBased()) return;

        await channelToVerify.send(responseComponents);
      } catch (e) {
        if (e instanceof Error) {
          await modal.followUp({
            content:
              "Não foi possível enviar a sua sugestão de projeto de lei. Tente novamente. Se o erro persistir, abra um ticket clicando no botão abaixo.",
            components: [Buttons.support()],
          });
        }
        throw e;
      }
    } catch (e) {
      if (e instanceof MongooseError) {
        await fetchError(e);
      }
    } finally {
      collector.stop();
    }
  });
}
