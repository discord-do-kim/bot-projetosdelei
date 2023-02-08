import {
  SlashCommandBuilder,
  Interaction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
} from "discord.js";
import { CommandPattern } from "../../commands/CommandPattern";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import {
  acceptedProjetoEmbed,
  handleSuggestionButtons,
  isNotifiedEmbed,
  projetoEmbed,
  rejectedProjetoEmbed,
} from "./utils";
import { Status } from "./enums/Status";
import { client } from "../../client";
import { Types } from "mongoose";

export class ProjectsCommand extends CommandPattern {
  command = new SlashCommandBuilder()
    .setName("projetos")
    .setDescription("funcionalidades para lidar com projetos.")
    .addSubcommand((sub) =>
      sub
        .setName("listagem")
        .setDescription("Buscar e listar projetos enviados.")
        .addStringOption((option) =>
          option
            .setName("status")
            .setDescription("filtrar projetos pelo status")
            .setChoices(
              { name: "pendente", value: "pending" },
              { name: "aceito", value: "accepted" },
              { name: "rejeitado", value: "rejected" }
            )
        )
        .addUserOption((option) =>
          option
            .setName("owner")
            .setDescription("filtrar pelo dono do projeto.")
        )
        .addUserOption((option) =>
          option
            .setName("mod")
            .setDescription("filtrar por moderador que tratou.")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("id")
        .setDescription("filtrar pelo id do projeto.")
        .addStringOption((option) =>
          option
            .setName("value")
            .setDescription("O id do projeto.")
            .setRequired(true)
        )
    );

  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.options.getSubcommand(true);
    await interaction.deferReply();

    switch (command) {
      case "listagem": {
        await this.searchByParams(interaction);
        break;
      }
      case "id": {
        await this.searchById(interaction);
        break;
      }
      default: {
        await interaction.followUp(
          "Não foi possível encontrar essa funcionalidade."
        );
        break;
      }
    }
  }

  async searchById(interaction: ChatInputCommandInteraction): Promise<void> {
    const id = interaction.options.getString("value");

    if (id === null || !Types.ObjectId.isValid(id)) {
      await interaction.followUp({
        content: "O ID enviado não é um ID válido.",
        ephemeral: true,
      });
      return;
    }

    const projeto = await ProjetoDeLeiModel.findById(id).exec();

    if (projeto === null) {
      await interaction.followUp(
        `Não foi possível encontrar o projeto o id "${id}".`
      );

      return;
    }

    const contentEmbed = await projetoEmbed(projeto);

    const status = projeto.meta.status;

    switch (status) {
      case "pending": {
        const components = handleSuggestionButtons();
        await interaction.followUp({
          embeds: [contentEmbed],
          components: [components],
        });
        break;
      }
      case "rejected": {
        const rejectedEmbed = await rejectedProjetoEmbed(projeto);
        await interaction.followUp({
          embeds: [contentEmbed, rejectedEmbed, isNotifiedEmbed(projeto)],
        });
        break;
      }
      case "accepted": {
        const acceptedEmbed = await acceptedProjetoEmbed(projeto);

        const button = new ActionRowBuilder<ButtonBuilder>();
        const thread = await client.channels
          .fetch(projeto.meta.threadId ?? "")
          .catch((e) => null);

        if (thread !== null) {
          button.addComponents(
            new ButtonBuilder({
              label: "Ver andamento do projeto.",
              style: ButtonStyle.Link,
              url: thread.url,
            })
          );
        }

        await interaction.followUp({
          embeds: [contentEmbed, acceptedEmbed, isNotifiedEmbed(projeto)],
          components: button.components.length > 0 ? [button] : [],
        });

        if (thread === null) {
          await interaction.followUp({
            content:
              "Não foi possível encontrar a thread do projeto de lei. Verifique se alguma coisa está errada.",
            ephemeral: true,
          });
        }

        break;
      }
      default:
        await interaction.followUp({
          content:
            "Eu encontrei o projeto, mas não consegui construir os embeds.",
          ephemeral: true,
        });
        break;
    }
  }

  async searchByParams(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const status = interaction.options.getString("status", false);
    let owner = interaction.options.getUser("owner", false);
    let mod = interaction.options.getUser("mod", false);

    if (owner !== null) owner = await owner.fetch();
    if (mod !== null) mod = await mod.fetch();

    let query = ProjetoDeLeiModel.find().sort({ createdAt: -1 });

    if (owner !== null) query = query.find({ owner: owner.id });
    if (mod !== null) query = query.find({ "meta.moderatorId": mod.id });
    if (status !== null) query = query.find({ "meta.status": status });

    const projetos = await query;

    const embed = new EmbedBuilder({
      title: "Listando projetos encontrados:",
      description: `
      ${owner !== null ? `Dono: @${owner.username}.` : ""}
      ${mod !== null ? `Fiscalizador: @${mod.username}.` : ""}
      ${status !== null ? `Status: ${Status[status as "accepted"]}.` : ""}\n
      `,
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.avatarURL() ?? undefined,
      },
      footer: {
        text: `Foram encontrados ao todo ${projetos.length} projetos.`,
      },
      color: Colors.Purple,
      timestamp: new Date(),
    });

    if (projetos.length > 25) {
      embed.setFooter({
        text: `Foram encontrados ao todo ${projetos.length} projetos, mas só podem ser exibidos os últimos 25.`,
      });
    }

    projetos.slice(0, 25).forEach((projeto) => {
      const date = `${projeto.createdAt.toLocaleString("pt-BR", {
        dateStyle: "medium",
        timeStyle: "medium",
      })}`;

      let value = projeto.title;
      value += `\nCriado em ${date}.`;
      value += `\nStatus de ${Status[projeto.meta.status]}.\n\n\n`;

      embed.addFields({
        name: projeto._id.toString(),
        value,
      });
    });

    await interaction.editReply({ embeds: [embed] });
  }
}
