import {
  SlashCommandBuilder,
  Interaction,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { CommandPattern } from "../../commands/CommandPattern";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { Components } from "./Components";

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
          option
            .setName("value")
            .setDescription("O id do projeto.")
            .setRequired(true)
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

      const response = await Components.handleProjectByStatus(projeto);

      await interaction.followUp(response);
    } catch (e) {
      interaction.followUp({ content: e.toString(), ephemeral: true });
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
