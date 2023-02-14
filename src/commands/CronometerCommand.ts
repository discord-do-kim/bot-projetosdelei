import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  Colors
} from "discord.js";
import dayjs from "dayjs";
import duration, { type Duration } from "dayjs/plugin/duration";
import { CommandPattern } from "./CommandPattern";
import { randomUUID } from "crypto";
import { CronJob } from "cron";
import { isTextChannel } from "../utils/isTextChannel";

dayjs.extend(duration);

export class CronometerCommand extends CommandPattern {
  command = new SlashCommandBuilder()
    .setName("cronometer")
    .setNameLocalizations({ "pt-BR": "cronômetro" })
    .setDescription("A stopwatch is a precise tool for measuring time.")
    .setDescriptionLocalizations({
      "pt-BR": "Um cronômetro é uma ferramenta precisa para medir o tempo."
    })
    .addUserOption((option) =>
      option
        .setName("mention")
        .setNameLocalizations({ "pt-BR": "mention" })
        .setDescription("mention the user")
        .setDescriptionLocalizations({ "pt-BR": "Mencione o usuário" })
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("time")
        .setNameLocalizations({ "pt-BR": "tempo" }) // Tempo em segundos
        .setDescription("time in seconds")
        .setDescriptionLocalizations({ "pt-BR": "tempo em segundos" })
        .setRequired(true)
        .addChoices(
          { name: "2m30s", value: 150 },
          { name: "1m30s", value: 90 },
          { name: "1m00s", value: 60 }
        )
    );

  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    const mention = interaction.options.getUser("mention");
    const description = mention !== null ? `Cronômetro para ${mention}` : null;
    const channel = interaction.channel;
    var seconds = interaction.options.getInteger("time")!;

    if (channel === null || !isTextChannel(channel)) {
      await interaction.followUp({
        content: "Não é possivel criar um cronômetro neste chat.",
        ephemeral: true
      });
      return;
    }

    const user = interaction.user;

    const embed = new EmbedBuilder({
      title: formatDuration(seconds!),
      color: Colors.Green,
      timestamp: new Date(),
      footer: {
        text: user.username,
        iconURL: user.avatarURL({ size: 16 }) ?? undefined
      }
    });

    embed.setDescription(description);

    const buttonStopId = randomUUID();
    const buttonPauseId = randomUUID();
    const buttonContinueId = randomUUID();
    const buttonRestartId = randomUUID();

    const buttonStop = new ButtonBuilder({
      customId: buttonStopId,
      label: "Parar",
      style: ButtonStyle.Danger
    });

    const buttonPause = new ButtonBuilder({
      customId: buttonPauseId,
      label: "Pausar",
      style: ButtonStyle.Primary
    });

    const buttonContinue = new ButtonBuilder({
      customId: buttonContinueId,
      label: "Continuar",
      style: ButtonStyle.Success
    });

    const buttonRestart = new ButtonBuilder({
      customId: buttonRestartId,
      label: "Reinicar",
      style: ButtonStyle.Secondary
    });

    const buttons = new ActionRowBuilder<ButtonBuilder>({
      components: [buttonPause, buttonStop, buttonRestart]
    });

    const message = await channel.send({
      embeds: [embed],
      components: [buttons]
    });

    let messageDeleted = false;

    await interaction.deleteReply();

    const collector = message.createMessageComponentCollector({
      // Only the user who created the message can interact with it
      filter: (compEvent) => compEvent.user.id === interaction.user.id
    });

    const cronometer: CronJob = new CronJob({
      cronTime: "* * * * * *",
      async onTick() {
        if (seconds <= 0) {
          cronometer.stop();
          collector.stop();
          embed.setColor("Red");
          embed.setTitle(`Tempo Esgotado!`);
          if (!messageDeleted) {
            await message.edit({ embeds: [embed], components: [] });
          }
          return;
        }

        seconds -= 1;

        embed.setTitle(formatDuration(seconds));

        if (messageDeleted) {
          collector.stop();
          cronometer.stop();
          return;
        }

        await message
          .edit({ embeds: [embed] })
          .catch(() => (messageDeleted = true));
      }
    });

    cronometer.start();

    collector.on("collect", async (btnInteraction) => {
      if (!btnInteraction.isButton()) return;
      switch (btnInteraction.customId) {
        case buttonStopId:
          await btnInteraction.reply({
            content: "Parando...",
            ephemeral: true
          });
          embed.setColor("Red");
          embed.setTitle(embed.data.title + " | Parado!");
          if (!messageDeleted) {
            await message.edit({ embeds: [embed], components: [] });
          }
          buttonStop.setLabel("parado");
          cronometer.stop();
          await btnInteraction.deleteReply();
          collector.stop();
          break;

        case buttonPauseId:
          await btnInteraction.reply({
            content: "Pausando...",
            ephemeral: true
          });
          embed.setColor("Blue");
          embed.setTitle(embed.data.title + " | Pausado!");
          buttons.setComponents(buttonContinue, buttonStop, buttonRestart);
          if (!messageDeleted) {
            await message.edit({ embeds: [embed], components: [buttons] });
          }
          cronometer.stop();
          await btnInteraction.deleteReply();
          break;

        case buttonContinueId:
          await btnInteraction.reply({
            content: "Iniciando...",
            ephemeral: true
          });
          embed.setColor("Green");
          embed.setTitle(formatDuration(seconds));
          buttons.setComponents(buttonPause, buttonStop, buttonRestart);
          if (!messageDeleted) {
            await message.edit({ embeds: [embed], components: [buttons] });
          }
          cronometer.start();
          await btnInteraction.deleteReply();
          break;

        case buttonRestartId:
          await btnInteraction.reply({
            content: "Reiniciando...",
            ephemeral: true
          });
          embed.setColor("Green");
          embed.setTitle("Reiniciando em 5 segundos...");
          buttons.setComponents(buttonPause, buttonStop, buttonRestart);
          if (!messageDeleted) {
            await message.edit({ embeds: [embed], components: [buttons] });
          }
          cronometer.stop();
          seconds = interaction.options.getInteger("time")!;
          await new Promise((r) => setTimeout(r, 5000));
          cronometer.start();
          await btnInteraction.deleteReply();
          break;
      }
    });
  }
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secondsLeft
    .toString()
    .padStart(2, "0")}`;
};
