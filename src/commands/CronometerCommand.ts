import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  Colors,
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
      "pt-BR": "Um cronômetro é uma ferramenta precisa para medir o tempo.",
    })
    .addStringOption((option) =>
      option
        .setName("description")
        .setNameLocalizations({ "pt-BR": "descrição" })
        .setDescription("give it a description")
        .setDescriptionLocalizations({ "pt-BR": "Dê a ele uma descrição" })
    );

  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    await interaction.deferReply({ ephemeral: true });

    const description = interaction.options.getString("description");

    const channel = interaction.channel;

    if (channel === null || !isTextChannel(channel)) {
      await interaction.followUp({
        content: "Não é possivel criar um cronômetro neste chat.",
        ephemeral: true,
      });

      return;
    }

    let duration = dayjs.duration({}).add(0, "s"); // Hack para garantir que o duration vai exibir o tempo certinho.

    const user = interaction.user;

    const embed = new EmbedBuilder({
      title: formatDuration(duration),
      color: Colors.Green,
      timestamp: new Date(),
      footer: {
        text: user.username,
        iconURL: user.avatarURL({ size: 16 }) ?? undefined,
      },
    });

    if (description !== null) embed.setDescription(description);

    const buttonStopId = randomUUID();
    const buttonPauseId = randomUUID();
    const buttonContinueId = randomUUID();

    const buttonStop = new ButtonBuilder({
      customId: buttonStopId,
      label: "Parar",
      style: ButtonStyle.Danger,
    });

    const buttonPause = new ButtonBuilder({
      customId: buttonPauseId,
      label: "Pausar",
      style: ButtonStyle.Primary,
    });

    const buttonContinue = new ButtonBuilder({
      customId: buttonContinueId,
      label: "Continuar",
      style: ButtonStyle.Success,
    });

    const buttons = new ActionRowBuilder<ButtonBuilder>({
      components: [buttonPause, buttonStop],
    });

    const message = await channel.send({
      embeds: [embed],
      components: [buttons],
    });

    let messageDeleted = false;

    await interaction.deleteReply();

    const collector = message.createMessageComponentCollector({
      filter: (compEvent) => compEvent.user.id === interaction.user.id,
    });

    const cronometer: CronJob = new CronJob({
      cronTime: "* * * * * *",
      onTick() {
        duration = duration.add(1, "second");

        embed.setTitle(formatDuration(duration));

        if (messageDeleted) {
          collector.stop();
          cronometer.stop();

          return;
        }

        message.edit({ embeds: [embed] }).catch(() => (messageDeleted = true));
      },
    });

    cronometer.start();

    collector.on("collect", async (btnInteraction) => {
      if (!btnInteraction.isButton()) return;
      switch (btnInteraction.customId) {
        case buttonStopId:
          await btnInteraction.reply({
            content: "Parando...",
            ephemeral: true,
          });
          embed.setColor("Red");
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
            ephemeral: true,
          });
          embed.setColor("Blue");
          buttons.setComponents(buttonContinue, buttonStop);
          if (!messageDeleted) {
            await message.edit({ embeds: [embed], components: [buttons] });
          }
          cronometer.stop();
          await btnInteraction.deleteReply();
          break;

        case buttonContinueId:
          await btnInteraction.reply({
            content: "Iniciando...",
            ephemeral: true,
          });
          embed.setColor("Green");
          buttons.setComponents(buttonPause, buttonStop);
          if (!messageDeleted) {
            await message.edit({ embeds: [embed], components: [buttons] });
          }
          cronometer.start();
          await btnInteraction.deleteReply();
          break;
      }
    });
  }
}

const formatDuration = (duration: Duration): string =>
  duration.format("H[h] m[m] s[s]");
