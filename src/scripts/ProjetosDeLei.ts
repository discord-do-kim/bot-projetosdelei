import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  Colors,
  ComponentType,
  EmbedBuilder,
  InteractionCollector,
  InteractionType,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { ScriptHandler } from "./ScriptHandler";

export class ProjetosDeLei extends ScriptHandler {
  private customIds = {
    suggestNewProject: "create-project",
    titleField: "project-title",
    contentField: "project-content",
    projectForm: "project-form",
    aprovedButton: "aproved-button",
    rejectButton: "reject-button",
    rejectReason: "reject-reason",
    rejectForm: "reject-form",
  };

  private channelToVerifyId: string;
  private channelToSendId: string;
  private lfpanelli: string;

  private suporteButton = new ActionRowBuilder<ButtonBuilder>({
    components: [
      new ButtonBuilder({
        style: ButtonStyle.Link,
        label: "Suporte",
        url: "https://discord.com/channels/739290482437259336/830071402202660874",
      }),
    ],
  });

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
    try {
      await this.handleTutorialEmbeds();
    } catch (e) {
      console.log(e);
    }
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

    if (!channel.isDMBased()) await channel.bulkDelete(20);

    await channel.send({
      embeds: [this.rejeitadasEmbed, this.repetidasEmbed, this.dicasEmbed],
    });

    await channel.send({
      content: "https://m.youtube.com/watch?v=M4DUxVJF-lQ&feature=youtu.be",
    });

    const sendProjectButton = new ButtonBuilder({
      label: "Enviar sugestão de projeto de lei!",
      customId: this.customIds.suggestNewProject,
      style: ButtonStyle.Secondary,
    });

    const buttons = new ActionRowBuilder<ButtonBuilder>({
      components: [sendProjectButton],
    });

    const faqMessage = await channel.send({
      embeds: [this.faqEmbed],
      components: [buttons],
    });

    const MessageCollector = faqMessage.createMessageComponentCollector();
    try {
      MessageCollector.on("collect", async (interaction: ButtonInteraction) => {
        if (!interaction.isButton()) return;

        const title = new TextInputBuilder({
          label: "Título da sugestão",
          required: true,
          maxLength: 80,
          minLength: 10,
          placeholder: "Descreva brevemente o seu projeto de lei.",
          style: TextInputStyle.Short,
          customId: this.customIds.titleField,
        });

        const content = new TextInputBuilder({
          label: "Conteúdo do seu Projeto:",
          required: true,
          placeholder:
            "Foque no conteúdo principal, para que ele não seja negado pela moderação do servidor.",
          style: TextInputStyle.Paragraph,
          customId: this.customIds.contentField,
        });

        const modal = new ModalBuilder({
          customId: this.customIds.projectForm,
          title: "Envia sua sugestão!",
          components: [
            new ActionRowBuilder<TextInputBuilder>().addComponents(title),
            new ActionRowBuilder<TextInputBuilder>().addComponents(content),
          ],
        });

        await interaction.showModal(modal);

        const collector = new InteractionCollector(this.client, {
          interactionType: InteractionType.ModalSubmit,
          filter: (modal) => interaction.user.id === modal.user.id,
        });

        collector.on("collect", async (modal) => {
          try {
            if (!modal.isModalSubmit()) return;

            const title = modal.fields.getTextInputValue(
              this.customIds.titleField
            );

            const content = modal.fields.getTextInputValue(
              this.customIds.contentField
            );

            if (!this.channelToVerify.isTextBased()) {
              await modal.reply({
                content:
                  "Não foi possível enviar a sua sugestão de projeto de lei. Por favor, abra um ticket clicando no botão abaixo.",
                ephemeral: true,
                components: [this.suporteButton],
              });
              return;
            }

            const user = interaction.user;

            const embed = new EmbedBuilder({
              author: { name: user.username, iconURL: user.avatarURL() },
              title,
              description: content,
              color: Colors.Blue,
              footer: { text: interaction.user.id },
              timestamp: new Date(),
            });

            const aproved = new ButtonBuilder({
              label: "Aprovar",
              customId: this.customIds.aprovedButton,
              style: ButtonStyle.Success,
            });

            const reject = new ButtonBuilder({
              label: "Rejeitar",
              customId: this.customIds.rejectButton,
              style: ButtonStyle.Danger,
            });

            const button = new ActionRowBuilder<ButtonBuilder>({
              components: [aproved, reject],
            });

            const message = await this.channelToVerify.send({
              embeds: [embed],
              components: [button],
            });

            await modal.reply({
              content:
                "A qualidade da sua sugestão será analisada pelos moderadores. Você será notificado no privado se a sua sugestão for aceita/rejeitada e o motivo!",
              ephemeral: true,
            });

            const inspectionColletor =
              message.createMessageComponentCollector();

            inspectionColletor.on("collect", async (inspecion) => {
              if (!inspecion.isButton()) return;
              switch (inspecion.customId) {
                case this.customIds.aprovedButton: {
                  await inspecion.deferReply({ ephemeral: true });
                  try {
                    const channel = interaction.channel;
                    if (
                      !channel.isTextBased() ||
                      channel.isDMBased() ||
                      channel.isVoiceBased() ||
                      channel.isThread()
                    ) {
                      throw new Error("");
                    }
                    const thread = await channel.threads.create({
                      name: embed.toJSON().title,
                      reason: "Novo projeto de lei",
                      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                      invitable: false as never,
                      type: ChannelType.PrivateThread as never,
                    });

                    const projectMessage = await thread.send({
                      content: `Projeto de lei sugerido por: ${interaction.user}.`,
                    });

                    await thread.send({
                      embeds: [
                        new EmbedBuilder({ description: content, title }),
                      ],
                    });

                    thread.members.add(interaction.user);

                    const responsible = await projectMessage.reply({
                      content: `Responsável pela fiscalização do canal: ${interaction.user}`,
                    });

                    await responsible.delete();

                    await projectMessage.reply({
                      content: `Projeto de lei sugerido para você, <@${this.lfpanelli}>!`,
                    });

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

                    message.edit({
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
                        timestamp: new Date(),
                      });

                      message.edit({
                        embeds: [embed, acceptEmbed, alertEmbed],
                      });
                    }
                  } catch (e) {
                    await inspecion.followUp({
                      content: `Não foi possível aceitar essa sugestão. Um erro aconteceu: ${e.toString()}. `,
                      ephemeral: true,
                    });
                  } finally {
                    await inspecion.followUp({
                      content: "Processo concluído.",
                      ephemeral: true,
                    });
                  }
                  break;
                }
                case this.customIds.rejectButton: {
                  const rejectReason = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                      {
                        type: ComponentType.TextInput,
                        customId: this.customIds.rejectReason,
                        required: true,
                        style: TextInputStyle.Paragraph,
                        label: "Descreva aqui o por quê.",
                        value:
                          "O seu projeto ou fere as diretrizes legais pré-estabelecidas, ou o seu projeto está fora dos conformes, de acordo com o tutorial exposto no canal de projetos-de-lei. Por favor, peço dê uma olhada antes de enviar o seu PL.",
                      },
                    ],
                  });

                  const modal = new ModalBuilder({
                    customId: this.customIds.rejectForm,
                    title: "Por que você rejeitou?",
                    components: [rejectReason],
                  });

                  await inspecion.showModal(modal);

                  const collector = new InteractionCollector(this.client, {
                    filter: (modal) => modal.user.id === inspecion.user.id,
                    interactionType: InteractionType.ModalSubmit,
                  });

                  collector.on(
                    "collect",
                    async (modal: ModalSubmitInteraction) => {
                      if (!modal.isModalSubmit()) return;
                      embed.setColor(Colors.Red);
                      modal.deferReply({ ephemeral: true });

                      const rejectReason = modal.fields.getTextInputValue(
                        this.customIds.rejectReason
                      );

                      const rejectEmbed = new EmbedBuilder({
                        title: "Motivo da Rejeição:",
                        description: rejectReason,
                        footer: {
                          icon_url: modal.user.avatarURL(),
                          text: "Rejeitado por @" + modal.user.username,
                        },
                        color: Colors.Red,
                        timestamp: new Date(),
                      });

                      await message.edit({
                        embeds: [embed, rejectEmbed],
                        components: [],
                      });

                      try {
                        await interaction.user.send({
                          content: `Seu projeto "${title}" foi rejeitado.`,
                          embeds: [
                            new EmbedBuilder({
                              ...embed.toJSON(),
                              footer: undefined,
                              author: undefined,
                            }),
                            rejectEmbed,
                          ],
                        });

                        const faqButton = new ActionRowBuilder<ButtonBuilder>({
                          components: [
                            new ButtonBuilder({
                              style: ButtonStyle.Link,
                              label: "Faq Projetos de Lei",
                              url: interaction.channel.url,
                            }),
                          ],
                        });

                        await interaction.user.send({
                          content:
                            "Se precisar de mais informações, clique nos botões abaixo:",
                          components: [this.suporteButton, faqButton],
                        });
                      } catch (e) {
                        message.edit({
                          embeds: [
                            embed,
                            rejectEmbed,
                            new EmbedBuilder({
                              footer: {
                                iconURL: interaction.user.avatarURL(),
                                text: "Não foi possível notificar o usuário no privado.",
                              },
                              color: Colors.Red,
                              timestamp: new Date(),
                            }),
                          ],
                        });
                      } finally {
                        modal.followUp("Processo concluído.");
                        collector.stop();
                      }
                    }
                  );

                  break;
                }
                default:
                  inspecion.followUp({
                    ephemeral: true,
                    content:
                      "Um erro aconteceu, não fui capaz de reconhecer a interação feita.",
                  });
                  break;
              }
            });

            collector.stop();
          } catch (e) {
            console.log(
              `\n\n\nUm erro aconteceu. ${new Date().toLocaleString("pt-BR", {
                dateStyle: "full",
                timeStyle: "full",
              })} Mais informações: \n\n\n\n${e}\n\n\n\n`
            );
          }
        });
      });
    } catch (e) {
      console.log(
        "Um erro aconteceu as: ",
        new Date().toLocaleString("pt-BR", {
          dateStyle: "full",
          timeStyle: "full",
        }),
        "\n\n\n",
        e.toString()
      );
    }
  }

  get rejeitadasEmbed() {
    return new EmbedBuilder({
      title: "POR QUE MINHA SUGESTÃO FOI REJEITADA?",
      color: Colors.Red,
      footer: {
        text: "lfpanelli",
      },
    });
  }

  get repetidasEmbed() {
    return new EmbedBuilder({
      title: "SUGESTÕES RECORRENTES.",
      color: Colors.Yellow,
      footer: {
        text: "lfpanelli",
      },
    });
  }

  get dicasEmbed() {
    return new EmbedBuilder({
      title: "BEM-VINDO AO DISCORD DE SUGESTÕES LEGISLATIVAS.",
      color: Colors.Blue,
    });
  }

  get faqEmbed() {
    return new EmbedBuilder({
      title: "FAQ SOBRE OS PROJETOS DE LEI",
      description:
        "Leia os cards acima antes de mandar o seu PL, para que ele não seja rejeitado ou removido. :)",
      fields: [
        {
          name: "1 - Primeiro precisamos que o seu PL esteja de acordo com o tutorial e avisos acima.",
          value:
            "Seu projeto será rejeitado se ele bater em alguns dos pontos citados acima.\n",
        },
        {
          name: "2 - O botão abaixo abrirá uma caixa de formulário que enviará o seu PL para moderação do servidor.",
          value:
            "Essa fiscalização é apenas para filtrar **FLOOD**, **SPAM**, **PROJETOS REPETIDOS**, e projetos que batem nos motivos de rejeição acima.\n",
        },
        {
          name: "3 - Você receberá um aviso no seu privado se o seu PL passar na fiscalização.",
          value:
            "Se você tiver o privado fechado, e o seu PL for rejeitado, você não vai saber o motivo. Procure o #suporte para mais informações.\n",
        },
        {
          name: "4 - Se o seu projeto for aceito na fiscalização, uma thread será aberta aqui mesmo nesse canal.",
          value:
            "Você é livre para mandar contexto adicional sobre o seu PL, mas não deve marcar o @lfpanelli.\n",
        },
      ],
      color: Colors.DarkButNotBlack,
    });
  }
}
