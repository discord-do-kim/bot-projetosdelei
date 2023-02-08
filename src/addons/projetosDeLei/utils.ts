import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Channel,
  Colors,
  EmbedBuilder,
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

export function openChannelButton(
  label: string,
  channel: Channel
): ButtonBuilder {
  return new ButtonBuilder({
    label,
    style: ButtonStyle.Link,
    url: channel.url,
  });
}

export async function projetoEmbed(projeto: Projeto): Promise<EmbedBuilder> {
  const owner = await client.users.fetch(projeto.owner);
  return new EmbedBuilder({
    author: { name: owner.username, iconURL: owner.avatarURL() ?? undefined },
    title: projeto.title,
    description: projeto.content,
    color: StatusColors[projeto.meta.status],
    footer: { text: projeto._id.toString() },
    timestamp: projeto.createdAt.toString(),
    fields: [{ name: owner.id, value: "\n" }],
  });
}

export function isNotifiedEmbed(projeto: Projeto): EmbedBuilder {
  const isNotified = projeto.meta.ownerNotified;
  if (isNotified) {
    return new EmbedBuilder({
      footer: { text: "O usuário foi notificado no privado." },
      color: Colors.Yellow,
      timestamp: projeto.meta.handledAt,
    });
  }

  return new EmbedBuilder({
    footer: { text: "Não foi possível notificar o usuário no privado." },
    color: Colors.Yellow,
    timestamp: projeto.meta.handledAt,
  });
}

export async function contentEmbed(projeto: Projeto): Promise<EmbedBuilder> {
  const owner = await client.users.fetch(projeto.owner);

  return new EmbedBuilder({
    author: {
      name: owner.username,
      icon_url: owner.avatarURL() ?? undefined,
    },
    title: projeto.title,
    description: projeto.content,
    color: StatusColors[projeto.meta.status],
    footer: { text: projeto._id.toString() },
    timestamp: new Date().toString(),
  });
}

export function handleSuggestionButtons(): ActionRowBuilder<ButtonBuilder> {
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

  return buttons;
}

export async function acceptedProjetoEmbed(
  projeto: Projeto
): Promise<EmbedBuilder> {
  const { status, moderatorId } = projeto.meta;

  if (status !== "accepted") {
    throw new Error("O projeto não está aceito");
  }

  if (moderatorId === undefined) {
    throw new Error("O projeto está malformado.");
  }

  const mod = await client.users.fetch(moderatorId);

  const acceptEmbed = new EmbedBuilder({
    footer: {
      iconURL: mod.avatarURL() ?? undefined,
      text: `Aprovado por @${mod.username}`,
    },
    timestamp: projeto.meta.handledAt?.toString(),
    color: Colors.Green,
  });

  return acceptEmbed;
}

export async function rejectedProjetoEmbed(
  projeto: Projeto
): Promise<EmbedBuilder> {
  const status = projeto.meta.status;
  const moderatorId = projeto.meta.moderatorId;
  if (status !== "rejected") throw new Error("O projeto não está rejeitado.");
  if (moderatorId === undefined) throw new Error("O projeto está malformado.");

  const mod = await client.users.fetch(moderatorId);

  const rejectEmbed = new EmbedBuilder({
    title: "Motivo da Rejeição:",
    description: projeto.meta.rejectReason,
    footer: {
      icon_url: mod.avatarURL() ?? undefined,
      text: `Rejeitado por ${mod.tag}`,
    },
    color: Colors.Red,
    timestamp: projeto.meta.handledAt?.toString(),
  });

  return rejectEmbed;
}
