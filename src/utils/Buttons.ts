import { ButtonBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonStyle, ThreadChannel } from "discord.js";

export class Buttons {
  public static support() {
    return new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          style: ButtonStyle.Link,
          label: "Suporte",
          url: "https://discord.com/channels/739290482437259336/830071402202660874",
        }),
      ],
    });
  }
}
