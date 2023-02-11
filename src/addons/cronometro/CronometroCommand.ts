import { ButtonStyle, ButtonBuilder, EmbedBuilder, SlashCommandBuilder, Interaction, ChatInputCommandInteraction, ActionRowBuilder, CacheType } from "discord.js";
import { CommandPattern } from "../../commands/CommandPattern";
// import { CronJob } from "cron";
// import { randomUUID } from "crypto";
// import  { Dayjs } from "dayjs";

// const dayjs = new Dayjs()

export class CronometroCommand extends CommandPattern {
    command = new SlashCommandBuilder()
        .setName("cronometro")
        .setDescription("Funcionalidades para o Cronômetro")

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;
        interaction.reply({
            content: "Cronômetro",
            ephemeral: true
        })
    }
    // async execute(interaction: Interaction): Promise<void> {
    //     if (!interaction.isChatInputCommand()) return;

    //     await interaction.deferReply({ ephemeral: true });
    
    //     const description = interaction.options.get("description");
    
    //     const channel = interaction.channel;
    
    //     if (interaction!.channel!.isTextBased()) {
    //       interaction.followUp({
    //         content: "Não é possivel criar um cronômetro neste chat.",
    //         ephemeral: true,
    //       });
    //     }
    
    //     let duration = dayjs.duration({}).add(0, "s"); // Hack para garantir que o duration vai exibir o tempo certinho.
    
    //     const user = interaction.user;
    
    //     const embed = new EmbedBuilder()
    //       .setTitle(duration)
    //       .setColor("Green")
    //       .setTimestamp(new Date())
    //       .setFooter({
    //         text: user.username,
    //       });
    
    //     if (description) embed.setDescription(description?.value?.toString());
    
    //     const buttonStopId = randomUUID();
    //     const buttonPauseId = randomUUID();
    //     const buttonContinueId = randomUUID();
    
    //     const buttonStop = new ButtonBuilder()
    //       .setCustomId(buttonStopId)
    //       .setLabel("Parar")
    //       .setStyle(ButtonStyle.Danger);
    
    //     const buttonPause = new ButtonBuilder()
    //       .setCustomId(buttonPauseId)
    //       .setLabel("Pausar")
    //       .setStyle(ButtonStyle.Primary);
    
    //     const buttonContinue = new ButtonBuilder()
    //       .setCustomId(buttonContinueId)
    //       .setLabel("Continuar")
    //       .setStyle(ButtonStyle.Success);
    
    //     const buttons = new ActionRowBuilder<ButtonBuilder>().setComponents(
    //       buttonPause,
    //       buttonStop
    //     );
    
    //     const message = await channel!.send({
    //       embeds: [embed],
    //       components: [buttons],
    //     });
    
    //     let messageDeleted = false;
    
    //     await interaction.deleteReply();
    
    //     const collector = message.createMessageComponentCollector({
    //       filter: (compEvent) => compEvent.user.id === interaction.user.id,
    //     });
    
    //     const cronometer: CronJob = new CronJob({
    //       cronTime: "* * * * * *",
    //       async onTick() {
    //         duration = duration.add(1, "second");
    
    //         embed.setTitle(formatDuration(duration));
    
    //         if (messageDeleted) {
    //           collector.stop();
    //           cronometer.stop();
    
    //           return;
    //         }
    
    //         await message
    //           .edit({ embeds: [embed] })
    //           .catch(() => (messageDeleted = true));
    //       },
    //     });
    
    //     cronometer.start();
    
    //     collector.on("collect", async (btnInteraction) => {
    //       if (!btnInteraction.isButton()) return;
    //       switch (btnInteraction.customId) {
    //         case buttonStopId:
    //           await btnInteraction.reply({
    //             content: "Parando...",
    //             ephemeral: true,
    //           });
    //           embed.setColor("Red");
    //           if (!messageDeleted) {
    //             await message.edit({ embeds: [embed], components: [] });
    //           }
    //           buttonStop.setLabel("parado");
    //           cronometer.stop();
    //           await btnInteraction.deleteReply();
    //           collector.stop();
    //           break;
    
    //         case buttonPauseId:
    //           await btnInteraction.reply({
    //             content: "Pausando...",
    //             ephemeral: true,
    //           });
    //           embed.setColor("Blue");
    //           buttons.setComponents(buttonContinue, buttonStop);
    //           if (!messageDeleted) {
    //             await message.edit({ embeds: [embed], components: [buttons] });
    //           }
    //           cronometer.stop();
    //           await btnInteraction.deleteReply();
    //           break;
    
    //         case buttonContinueId:
    //           await btnInteraction.reply({
    //             content: "Iniciando...",
    //             ephemeral: true,
    //           });
    //           embed.setColor("Green");
    //           buttons.setComponents(buttonPause, buttonStop);
    //           if (!messageDeleted) {
    //             await message.edit({ embeds: [embed], components: [buttons] });
    //           }
    //           cronometer.start();
    //           await btnInteraction.deleteReply();
    //           break;
    //       }
    //     });
    //   }
    }