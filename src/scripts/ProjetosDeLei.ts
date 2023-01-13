import { randomUUID } from "crypto";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  Colors,
  EmbedBuilder,
  Events,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { projetosData } from "../db/projetosData";
import { ScriptHandler } from "./ScriptHandler";

export class ProjetosDeLei extends ScriptHandler {
  private projectRejectData = {
    rejectModalId: randomUUID(),
    rejectReasonField: randomUUID(),
  };

  private projectCreateData = {
    buttonId: randomUUID(),
    userId: "",
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

  private channelToVerifyId: string;
  private channelToSendId: string;
  private lfpanelli: string;

  constructor(options: {
    channelToVerifyId: string;
    channelToSendId: string;
    lfpanelli: string;
  }) {
    super();
    this.channelToSendId = options.channelToSendId;
    this.channelToVerifyId = options.channelToVerifyId;
    this.lfpanelli = options.lfpanelli;
  }

  async run() {
    await this.handleTutorialEmbeds();
    await this.handleOpenSugestionModal();
    await this.handleSugestionSend();
    await this.handleButtonInspecion();
    await this.handleModalReject();
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
        .setColor(Colors.Blue)
        .setDescription(content)
        .setFooter({ text: interaction.user.id })
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

      await this.channelToVerify.send({
        embeds: [embed],
        components: [button],
      });

      this.projectCreateData.userId = interaction.user.id;
    });
  }

  private async handleButtonInspecion() {
    this.client.on(Events.InteractionCreate, (interaction) => {
      if (!interaction.isButton()) return;

      const interactionId = interaction.customId;

      const aprovedId = this.inspecionData.aprovedButtonId;
      const rejectId = this.inspecionData.rejectButtonId;

      if (interactionId === aprovedId) {
        this.handleButtonAproved(interaction);
        return;
      }
      if (interactionId === rejectId) {
        this.handleButtonReject(interaction);
        return;
      }
    });
  }

  private async handleButtonAproved(interaction: ButtonInteraction) {
    interaction.deferReply({ ephemeral: true });
    const message = await interaction.message.fetch();
    const oldEmbed = message.embeds[0];

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle(oldEmbed.title)
      .setDescription(oldEmbed.description)
      .setFooter({
        text: "Projeto de lei sugerido por @" + oldEmbed.author.name,
      })
      .setTimestamp(new Date(oldEmbed.timestamp));

    if (
      !this.channelToSend.isTextBased() ||
      this.channelToSend.isThread() ||
      this.channelToSend.isDMBased() ||
      this.channelToSend.isVoiceBased()
    )
      return interaction.followUp({
        content: "Não foi possível aceitar essa sugestão",
        ephemeral: true,
      });

    try {
      const thread = await this.channelToSend.threads.create({
        name: embed.toJSON().title,
        reason: "Novo projeto de lei",
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        invitable: false as never,
        type: ChannelType.PrivateThread as never,
      });

      const projectMessage = await thread.send({
        content: `Projeto de lei sugerido por: <@${this.projectCreateData.userId}>.`,
        embeds: [embed],
      });

      thread.members.add(interaction.user);

      await projectMessage
        .reply({
          content: `Responsável pela fiscalização do canal: ${interaction.user}`,
        })
        .then((e) => e.delete());

      projectMessage.reply({
        content: `Projeto de lei sugerido para você, <@${this.lfpanelli}>!`,
      });

      const author = this.client.users.cache.get(this.projectCreateData.userId);

      await author.send({
        content: "Seu projeto de lei foi aceito.",
        embeds: [embed],
      });
    } catch (e) {
      console.log(e);
      return;
    }

    const acceptEmbed = new EmbedBuilder()
      .setColor("Green")
      .setFooter({
        iconURL: interaction.user.avatarURL({ size: 32 }),
        text: `Aprovado por @${interaction.user.username}`,
      })
      .setTimestamp(new Date());

    try {
      await message.edit({ embeds: [embed, acceptEmbed], components: [] });
    } catch (e) {
      console.log(e);
    }

    await interaction.editReply({
      content: "Projeto aceito.",
    });
  }

  private async handleButtonReject(interaction: ButtonInteraction) {
    const field = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId(this.projectRejectData.rejectReasonField)
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph)
        .setLabel("Descreva aqui o por quê.")
    );

    const modal = new ModalBuilder()
      .setCustomId(this.projectRejectData.rejectModalId)
      .setTitle("Por que você rejeitou?")
      .addComponents(field);

    await interaction.showModal(modal);
  }

  private async handleModalReject() {
    this.client.on(
      Events.InteractionCreate,
      async (interaction: Interaction) => {
        if (!interaction.isModalSubmit()) return;

        if (interaction.customId !== this.projectRejectData.rejectModalId)
          return;

        interaction.deferReply();
        const reason = interaction.fields.getTextInputValue(
          this.projectRejectData.rejectReasonField
        );

        const message = await interaction.message.fetch();
        const embed = message.embeds[0];

        const reasonEmbed = new EmbedBuilder()
          .setTitle("Motivo da Rejeição:")
          .setDescription(reason)
          .setColor(Colors.Red)
          .setFooter({
            iconURL: interaction.user.avatarURL(),
            text: `Rejeitado por @${interaction.user.username}`,
          });

        try {
          await message.edit({
            embeds: [embed, reasonEmbed],
            components: [],
          });
        } catch (e) {
          await interaction.followUp({
            ephemeral: true,
            content: `Alguma coisa deu errado. ${e}`,
          });

          return;
        }

        try {
          await this.client.users.send(this.projectCreateData.userId, {
            content: "Seu projeto de lei no Discord Do Kim foi rejeitado.",
            embeds: [embed, reasonEmbed],
          });
        } catch (e) {
          await interaction.followUp({
            content: `Não foi possível enviar o motivo da rejeição para o usuário <@${this.projectCreateData.userId}>. Talvez ele pergunte o por quê.`,
          });

          return;
        }

        await interaction.followUp({
          ephemeral: true,
          content: "Motivo da rejeição enviado com sucesso!",
        });
      }
    );
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
