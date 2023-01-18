import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Channel,
  Colors,
  EmbedBuilder,
  User,
} from "discord.js";
import { Document, Types } from "mongoose";
import { client } from "../../client";
import { ProjetoDeLei } from "../../models/ProjetoDeLei";
import { config } from "./config";
import { StatusColors } from "./enums/Status";

type Projeto = Document<unknown, any, ProjetoDeLei> &
  ProjetoDeLei & {
    _id: Types.ObjectId;
  };

export class Components {
  public static openChannel(label: string, thread: Channel) {
    return new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          label: label,
          style: ButtonStyle.Link,
          url: thread.url,
        }),
      ],
    });
  }

  private static projectEmbed(projeto: Projeto, owner: User) {
    return new EmbedBuilder({
      author: { name: owner.username, iconURL: owner.avatarURL() },
      title: projeto.title,
      description: projeto.content,
      color: StatusColors[projeto.meta.status],
      footer: { text: projeto._id.toString() },
      timestamp: new Date(),
    });
  }

  private static notNotifiedEmbed(projeto: Projeto) {
    return new EmbedBuilder({
      footer: { text: "Não foi possível notificar o usuário" },
      color: Colors.Yellow,
      timestamp: projeto.meta.handledAt,
    });
  }

  public static async acceptedComponents(projeto: Projeto) {
    if (projeto.meta.status !== "accepted") throw new Error("");

    const owner = await client.users.fetch(projeto.userId);
    const mod = await client.users.fetch(projeto.meta.moderator);
    const thread = await client.channels.fetch(projeto.meta.thread);

    const embed = this.projectEmbed(projeto, owner);

    const acceptEmbed = new EmbedBuilder({
      footer: {
        iconURL: mod.avatarURL({
          size: 32,
        }),
        text: `Aprovado por @${owner.username}`,
      },
      timestamp: projeto.meta.handledAt,
      color: Colors.Green,
    });

    const button = this.openChannel("Ver andamento do projeto.", thread);

    const embeds = [embed, acceptEmbed];

    if (!projeto.meta.notified) embeds.push(this.notNotifiedEmbed(projeto));

    return { embeds, components: [button] };
  }

  public static async rejectedComponents(projeto: Projeto) {
    if (projeto.meta.status !== "rejected") throw new Error("");

    const owner = await client.users.fetch(projeto.userId);
    const mod = await client.users.fetch(projeto.meta.moderator);

    const embed = this.projectEmbed(projeto, owner);

    const rejectEmbed = new EmbedBuilder({
      title: "Motivo da Rejeição:",
      description: projeto.meta.rejectReason,
      footer: {
        icon_url: mod.avatarURL(),
        text: `Rejeitado por ${mod.tag}`,
      },
      color: Colors.Red,
      timestamp: projeto.meta.rejectReason,
    });

    const embeds = [embed, rejectEmbed];

    if (!projeto.meta.notified) embeds.push(this.notNotifiedEmbed(projeto));

    return { embeds };
  }

  public static async pendingComponents(projeto: Projeto) {
    if (projeto.meta.status !== "pending") throw new Error("");

    const owner = await client.users.fetch(projeto.userId);

    const embed = this.projectEmbed(projeto, owner);

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

    const buttons = new ActionRowBuilder<ButtonBuilder>({
      components: [aproved, reject],
    });

    return { embeds: [embed], components: [buttons] };
  }

  public static async handleProjectByStatus(projeto: Projeto) {
    switch (projeto.meta.status) {
      case "accepted":
        return this.acceptedComponents(projeto);
      case "pending":
        return this.pendingComponents(projeto);
      case "rejected":
        return this.rejectedComponents(projeto);
    }
  }
}
