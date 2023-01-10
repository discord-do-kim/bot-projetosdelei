import { randomUUID } from "crypto";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  time,
} from "discord.js";
import { projetosData } from "../db/projetosData";
import { ScriptHandler } from "./ScriptHandler";

export class ProjetosDeLei extends ScriptHandler {
  private projectCreateData = {
    buttonId: randomUUID(),
  };

  private sugestionModalData = {
    titleId: randomUUID(),
    contentId: randomUUID(),
    modalId: randomUUID(),
  };

  private inspecionData = {
    aprovedButtonId: randomUUID(),
    rejectButtonId: randomUUID(),
  };

  constructor(
    private channelToVerifyId: string,
    private channelToSendId: string
  ) {
    super();
  }

  async run() {
    await this.handleTutorialEmbeds();
    await this.handleOpenSugestionModal();
    await this.handleSugestionSend();
    await this.handleButtonInspecion();
  }

  get channelToSend() {
    return this.client.channels.cache.get(this.channelToSendId);
  }

  get channelToVerify() {
    return this.client.channels.cache.get(this.channelToVerifyId);
  }

  private async handleTutorialEmbeds() {
    const channel = this.channelToSend;

    if (!channel.isTextBased()) throw new Error("Channel is not text based");

    if (!channel.isDMBased()) await channel.bulkDelete(10);

    await channel.send({
      embeds: [this.rejeitadasEmbed, this.repetidasEmbed, this.dicasEmbed],
    });

    await channel.send({
      content: "https://m.youtube.com/watch?v=M4DUxVJF-lQ&feature=youtu.be",
    });

    const sendProjectButton = new ButtonBuilder()
      .setLabel("Enviar sugestão de projeto de lei")
      .setCustomId(this.projectCreateData.buttonId)
      .setStyle(ButtonStyle.Secondary);

    const buttons = new ActionRowBuilder<ButtonBuilder>().setComponents(
      sendProjectButton
    );

    await channel.send({
      embeds: [this.faqEmbed],
      components: [buttons],
    });
  }

  private async handleOpenSugestionModal() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId !== this.projectCreateData.buttonId) return;

      const title = new TextInputBuilder()
        .setCustomId(this.sugestionModalData.titleId)
        .setLabel("Título da sugestão")
        .setRequired(true)
        .setMaxLength(100)
        .setPlaceholder("Descreva brevemente o seu projeto de lei.")
        .setMinLength(3)
        .setStyle(TextInputStyle.Short);

      const content = new TextInputBuilder()
        .setCustomId(this.sugestionModalData.contentId)
        .setLabel("Conteúdo")
        .setRequired(true)
        .setPlaceholder("O conteúdo do seu projeto de lei.")
        .setStyle(TextInputStyle.Paragraph);

      const modal = new ModalBuilder()
        .setCustomId(this.sugestionModalData.modalId)
        .setTitle("Envie sua sugestão!")
        .setComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(title),
          new ActionRowBuilder<TextInputBuilder>().addComponents(content)
        );

      await interaction.showModal(modal);
    });
  }

  private async handleSugestionSend() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isModalSubmit()) return;
      if (interaction.customId !== this.sugestionModalData.modalId) return;

      await interaction.reply({
        content:
          "Sua sugestão será analisada pelos moderadores. Você será notificado no privado se a sua sugestão for aceita/rejeitada e o motivo!",
        ephemeral: true,
      });

      const title = interaction.fields.getTextInputValue(
        this.sugestionModalData.titleId
      );

      const content = interaction.fields.getTextInputValue(
        this.sugestionModalData.contentId
      );

      if (!this.channelToVerify.isTextBased()) return;

      const user = interaction.user;

      const embed = new EmbedBuilder()
        .setAuthor({
          name: user.username,
          iconURL: user.avatarURL(),
        })
        .setTitle(title)
        .setDescription(content)
        .setFields({ name: "Sugerido em:", value: time() })
        .setTimestamp(new Date());

      const aproved = new ButtonBuilder()
        .setLabel("Aprovar")
        .setCustomId(this.inspecionData.aprovedButtonId)
        .setStyle(ButtonStyle.Success);

      const reject = new ButtonBuilder()
        .setLabel("Rejeitar")
        .setCustomId(this.inspecionData.rejectButtonId)
        .setStyle(ButtonStyle.Danger);

      const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
        aproved,
        reject
      );

      this.channelToVerify.send({ embeds: [embed], components: [button] });
    });
  }

  private async handleButtonInspecion() {
    this.client.on(Events.InteractionCreate, (interaction) => {
      if (!interaction.isButton()) return;

      const interactionId = interaction.customId;

      const aprovedId = this.inspecionData.aprovedButtonId;
      const rejectId = this.inspecionData.rejectButtonId;

      if (interactionId === aprovedId)
        return this.handleButtonAproved(interaction);
      if (interactionId === rejectId)
        return this.handleButtonReject(interaction); //
    });
  }

  private async handleButtonAproved(interaction: ButtonInteraction) {
    interaction.deferReply({ ephemeral: true });
    const message = await interaction.message.fetch();
    const embed = message.embeds[0];

    const newEmbed = new EmbedBuilder(embed)
      .setColor("Green")
      .setFooter({
        iconURL: interaction.user.avatarURL({ size: 32 }),
        text: `Aprovado por @${interaction.user.username}`,
      })
      .addFields([{ name: "Aceito em: ", value: time() }])
      .setTimestamp(new Date());

    try {
      await message.edit({ embeds: [newEmbed], components: [] });
    } catch (e) {
      console.log(e);
    }

    await interaction.editReply({
      content: "Projeto aceito.",
    });
  }

  private async handleButtonReject(interaction: ButtonInteraction) {
    interaction.deferReply({ ephemeral: true });
    const message = await interaction.message.fetch();
    const embed = message.embeds[0];

    const newEmbed = new EmbedBuilder(embed)
      .setColor("Red")
      .setFooter({
        iconURL: interaction.user.avatarURL({ size: 32 }),
        text: `Rejeitado por @${interaction.user.username}`,
      })
      .addFields([{ name: "Rejeitado em: ", value: time() }])
      .setTimestamp(new Date());

    try {
      await message.edit({ embeds: [newEmbed], components: [] });
    } catch (e) {
      console.log(e);
    }

    await interaction.editReply({
      content: "Projeto rejeitado.",
    });
  }

  get rejeitadasEmbed() {
    return new EmbedBuilder()
      .setTitle("POR QUE MINHA SUGESTÃO FOI REJEITADA?")
      .setDescription(projetosData.rejeitados)
      .setColor("Red")
      .setFooter({
        text: "lfpanelli",
        iconURL: projetosData.avatarPanelli,
      });
  }

  get repetidasEmbed() {
    return new EmbedBuilder()
      .setTitle("SUGESTÕES RECORRENTES.")
      .setDescription(projetosData.recorrentes)
      .setColor("Yellow")
      .setFooter({
        text: "lfpanelli",
        iconURL: projetosData.avatarPanelli,
      });
  }

  get dicasEmbed() {
    return new EmbedBuilder()
      .setTitle("BEM-VINDO AO DISCORD DE SUGESTÕES LEGISLATIVAS.")
      .setDescription(projetosData.tip)
      .setColor("Blue");
  }

  get faqEmbed() {
    return new EmbedBuilder()
      .setTitle("FAQ SOBRE OS PROJETOS DE LEI")
      .setDescription(
        "Leia os cards acima antes de mandar o seu PL, para que ele não seja rejeitado (Por qual motivo minha PL foi rejeitada?) ou removido. :)"
      )
      .setFields([
        {
          name: "Como mandar a sugestão de um projeto de lei?",
          value:
            "1 - Primeiro precisamos que o seu PL esteja de acordo com o FAQ acima.",
        },
      ])
      .setColor("DarkButNotBlack");
  }
}
