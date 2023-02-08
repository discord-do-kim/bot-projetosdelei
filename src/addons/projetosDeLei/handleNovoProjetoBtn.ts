import {
  Interaction,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  ActionRowBuilder,
  InteractionCollector,
  InteractionType,
  EmbedBuilder,
  DiscordAPIError,
  Client,
} from "discord.js";
import { client } from "../../client";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { config } from "./config";
import { handleSuggestionButtons, projetoEmbed } from "./utils";
import { isTextChannel } from "../../utils/isTextChannel";
import { fetchError } from "../../utils/fetchError";

export async function handleNovoProjetoBtn(
  interaction: Interaction
): Promise<void> {
  if (!interaction.isButton()) return;
  if (interaction.customId !== config.customIds.suggestNewProject) return;

  const channelToVerify = await client.channels.fetch(config.verify_channel);

  if (channelToVerify === null) {
    throw new Error(
      "Não foi possível encontrar o canal para enviar os embeds."
    );
  }

  if (!isTextChannel(channelToVerify)) {
    throw new Error(
      `Não consigo enviar projetos de lei para o canal específicado.`
    );
  }

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

  const collector = new InteractionCollector(client as Client<true>, {
    interactionType: InteractionType.ModalSubmit,
    filter: (modal) => interaction.user.id === modal.user.id,
    maxUsers: 1,
    max: 1,
  });

  collector.on("collect", async (modal): Promise<void> => {
    if (!modal.isModalSubmit()) return;
    const title = modal.fields.getTextInputValue(config.customIds.titleField);

    const content = modal.fields.getTextInputValue(
      config.customIds.contentField
    );
    try {
      await modal.deferReply({ ephemeral: true });

      const user = interaction.user;

      const projeto = await new ProjetoDeLeiModel({
        title,
        content,
        owner: user.id,
      }).save();

      const embed = await projetoEmbed(projeto);

      const suggestionButtons = handleSuggestionButtons();

      await channelToVerify.send({
        embeds: [embed],
        components: [suggestionButtons],
      });

      await modal.followUp({
        content:
          "Seu projeto de lei foi enviado para a moderação fiscalizar. Você será notificado no privado se o seu projeto passar na fiscalização e encaminhada para assessoria do Kim.",
      });
    } catch (e) {
      await fetchError(e);

      if (e instanceof DiscordAPIError && e.code === "40060") return;

      const message = {
        content:
          "Não foi possível enviar o seu projeto de lei. Por favor, tente novamente. \nCópia do conteúdo:",
        embeds: [new EmbedBuilder({ title, description: content })],
      };

      await interaction
        .followUp({
          ...message,
          ephemeral: true,
        })
        .catch(async (e) => {
          return await interaction.user.send(message);
        })
        .catch(async (e) => {
          await fetchError(e);
        });
    } finally {
      collector.stop();
    }
  });
}
