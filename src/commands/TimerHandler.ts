import {
  SlashCommandBuilder,
  type CommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  time,
} from "discord.js";
import dayjs from "dayjs";
import duration, { Duration } from "dayjs/plugin/duration";
import { CommandHandler } from "./CommandHandler";
import { randomUUID } from "crypto";
import { CronJob } from "cron";

dayjs.extend(duration);

export class TimerHandler extends CommandHandler {
  public readonly command = new SlashCommandBuilder()
    .setName("timer")
    .setNameLocalizations({ "pt-BR": "temporizador" })
    .setDescription("A timer is a tool that measures time.")
    .setDescriptionLocalizations({
      "pt-BR": "Temporizador é uma ferramenta que mede o tempo.",
    })
    .addIntegerOption((option) =>
      option
        .setName("hours")
        .setNameLocalizations({ "pt-BR": "horas" })
        .setDescription("number of hours to add to the timer. Minimum of 0")
        .setDescriptionLocalizations({
          "pt-BR":
            "Quantidade de horas a adicionar no temporizador. Mínimo de 0.",
        })
        .setMinValue(0)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setNameLocalizations({ "pt-BR": "minutos" })
        .setDescription("number of minutes to add to the timer. Minimum of 0.")
        .setDescriptionLocalizations({
          "pt-BR":
            "Quantidade de minutos a adicionar no temporizador. Mínimo de 0.",
        })
        .setMinValue(0)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("seconds")
        .setNameLocalizations({ "pt-BR": "segundos" })
        .setDescription("number of seconds to add to the timer. Minimum of 0.")
        .setDescriptionLocalizations({
          "pt-BR":
            "Quantidade de segundos a adicionar no temporizador. Mínimo de 0.",
        })
        .setMinValue(0)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setNameLocalizations({ "pt-BR": "descrição" })
        .setDescription("give it a description")
        .setDescriptionLocalizations({ "pt-BR": "Dê a ele uma descrição" })
    )
    .addUserOption((option) =>
      option
        .setName("mention")
        .setNameLocalizations({ "pt-BR": "mencionar" })
        .setDescription("A user to mention at the end of the timer.")
        .setDescriptionLocalizations({
          "pt-BR": "Um usuário para mencionar no final do temporizador.",
        })
    );

  public async execute(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const description = interaction.options.get("description");
    const hours = interaction.options.get("hours");
    const minutes = interaction.options.get("minutes");
    const seconds = interaction.options.get("seconds");
    const mention = interaction.options.getUser("mention");

    const channel = interaction.channel;

    if (!interaction.channel.isTextBased()) {
      interaction.followUp({
        content: "Não é possivel criar um temporizador neste chat.",
        ephemeral: true,
      });
    }

    const duration = dayjs
      .duration({
        hours: hours.value as number,
        minutes: minutes.value as number,
        seconds: seconds.value as number,
      })
      .add(0, "s"); // Hack para garantir que o duration vai exibir o tempo certinho.

    const startOfTimer = dayjs();
    const endOfTimer = dayjs().add(duration.asSeconds(), "seconds").toDate();

    const user = interaction.user;

    const embed = new EmbedBuilder()
      .setTitle(formatDuration(duration))
      .setColor("Green")
      .setTimestamp(new Date())
      .setFooter({
        text: user.username,
        iconURL: user.avatarURL({ size: 16 }),
      });

    if (description) embed.setDescription(description?.value?.toString());

    const buttonStopId = randomUUID();

    const buttonStop = new ButtonBuilder()
      .setCustomId(buttonStopId)
      .setLabel("Parar")
      .setStyle(ButtonStyle.Danger);

    const buttons = new ActionRowBuilder<ButtonBuilder>().setComponents(
      buttonStop
    );

    const message = await channel.send({
      embeds: [embed],
      components: [buttons],
    });

    await interaction.deleteReply();

    const collector = message.createMessageComponentCollector({
      filter: (compEvent) => compEvent.user.id === interaction.user.id,
    });

    const cronometer: CronJob = new CronJob({
      cronTime: "* * * * * *",
      async onTick() {
        if (duration.asSeconds() === 0) return cronometer.stop();

        const elapsed = dayjs().diff(startOfTimer, "s");

        const newDuration = duration.subtract(elapsed, "second");

        embed.setTitle(formatDuration(newDuration));

        try {
          await message.edit({ embeds: [embed] }).catch(cronometer.stop);
        } catch (e) {
          throw new Error("");
        }

        if (dayjs().isAfter(endOfTimer)) return cronometer.stop();
      },
      async onComplete() {
        embed.setColor("Red");
        embed.setTimestamp(new Date());
        buttonStop.setDisabled(true);

        buttonStop.setLabel("Parado");

        await message.edit({
          embeds: [embed],
          components: [buttons],
        });

        await channel.send({
          reply: { messageReference: message.id, failIfNotExists: false },
          content: `O temporizador acabou ${time(new Date(), "R")}, ${user}${
            mention ? ` and ${mention}!` : "!"
          }`,
        });
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

          cronometer.stop();

          await btnInteraction.deleteReply();
          collector.stop();
          break;
      }
    });
  }
}

const formatDuration = (duration: Duration) =>
  duration.format("H[h] m[m] s[s]");
