import {
  SlashCommandBuilder,
  Interaction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { client } from "../../client";
import { CommandPattern } from "../../commands/CommandPattern";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { config } from "./config";

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
            .setName("user")
            .setDescription("filtrar por usuário que enviou")
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
          option.setName("id").setDescription("filtrar pelo id do projeto.")
        )
    );

  async execute(interaction: Interaction) {
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

  async searchById(interaction: ChatInputCommandInteraction) {
    try {
      const id = interaction.options.getString("id");

      const projeto = await ProjetoDeLeiModel.findById(id);

      const user = await client.users.cache.get(projeto.userId)?.fetch();

      const embed = new EmbedBuilder({
        title: projeto.title,
        description: projeto.content,
        author: {
          name: user.username,
          iconURL: user.avatarURL(),
        },
        footer: {
          text: projeto._id.toString(),
        },
        timestamp: projeto.meta.createdAt,
        color:
          projeto.meta.status === "pending"
            ? Colors.Blue
            : projeto.meta.status === "accepted"
            ? Colors.Green
            : Colors.Red,
      });

      if (projeto.meta.status === "pending") {
        const reject = new ButtonBuilder({
          label: "Rejeitar",
          customId: config.customIds.rejectButton,
          style: ButtonStyle.Danger,
        });

        const aproved = new ButtonBuilder({
          label: "Aprovar",
          customId: config.customIds.aprovedButton,
          style: ButtonStyle.Success,
        });

        const button = new ActionRowBuilder<ButtonBuilder>({
          components: [aproved, reject],
        });

        await interaction.followUp({ embeds: [embed], components: [button] });
        return;
      }

      const mod = await client.users.cache.get(projeto.meta.moderator).fetch();

      embed.setFooter({ text: `${projeto.meta.status} por ${mod.username}` });

      await interaction.followUp({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({
        content: "Não foi possível buscar por esse ID de projeto.",
      });
    }
  }

  async searchByParams(interaction: ChatInputCommandInteraction) {
    const status = interaction.options.getString("status", false);
    let user = interaction.options.getUser("user", false);
    let mod = interaction.options.getUser("mod", false);

    if (user) user = await user.fetch();
    if (mod) mod = await mod.fetch();

    let query = ProjetoDeLeiModel.find();

    if (user) query = query.find({ userId: user.id });
    if (mod) query = query.find({ "meta.moderator": mod.id });
    if (status) query = query.find({ "meta.status": status });

    const projetosDeLei = await query;

    const embed = new EmbedBuilder({
      title: "Mostrando até 25 resultados de projetos de lei",
      description: `
      ${user !== null ? `Criados por: @${user.username}` : ""}
      ${mod !== null ? `Tratados por: @${mod.username}` : ""}
      ${status !== null ? `Status Atual: ${status}` : ""}
      `,
      footer: {
        text: "Busca realizada por: @" + interaction.user.username,
      },
      timestamp: new Date(),
    });

    projetosDeLei.forEach((projeto) => {
      const date =
        "Criado: " +
        projeto.meta.createdAt.toLocaleString("pt-BR", {
          dateStyle: "medium",
          timeStyle: "medium",
        });

      const value = `
**id:** ${projeto._id.toString()}
**Criado:** ${date}
**Status:** ${projeto.meta.status}\n\n`;

      embed.addFields({
        name: projeto.title,
        value,
      });
    });

    await interaction.editReply({ embeds: [embed] });
  }
}
