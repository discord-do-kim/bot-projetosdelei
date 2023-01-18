import { EmbedBuilder } from "@discordjs/builders";
import {
  ChannelType,
  ThreadAutoArchiveDuration,
  ThreadChannel,
} from "discord.js";
import { client } from "../../client";
import { ProjetoDeLeiModel } from "../../models/ProjetoDeLei";
import { config } from "./config";

export async function openThread(projectId: string): Promise<ThreadChannel> {
  const project = await ProjetoDeLeiModel.findById(projectId);

  const channel = await client.channels.fetch(config.send_channel);

  if (
    !channel.isTextBased() ||
    channel.isDMBased() ||
    channel.isVoiceBased() ||
    channel.isThread()
  ) {
    throw new Error();
  }

  if (!project) return;
  if (project.meta.status === "rejected") return;
  if (project.meta.thread) {
    const thread = await client.channels.fetch(project.meta.thread);
    if (thread.isThread()) return thread;
    throw new Error(
      "O canal responsável por esse projeto existe no banco, mas não é uma thread."
    );
  }

  const mod = await client.users.fetch(project.meta.moderator);
  const owner = await client.users.fetch(project.userId);

  const embed = new EmbedBuilder({
    title: project.title,
    description: project.content,
  });

  const thread = await channel.threads.create({
    name: embed.toJSON().title,
    reason: "Novo projeto de lei",
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    invitable: false as never,
    type: ChannelType.PrivateThread as never,
  });

  const message = await thread.send({
    content: `Projeto de lei sugerido por: ${owner}.`,
    embeds: [
      new EmbedBuilder({
        title: project.title,
        description: project.content,
      }),
    ],
  });

  await thread.members.add(mod).catch();

  await message
    .reply({
      content: `Responsável pela fiscalização do canal: ${mod}`,
    })
    .then((e) => e.delete())
    .catch();

  await message.reply({
    content: `Projeto de lei sugerido para você, <@${config.mention_user}>!`,
  });

  await ProjetoDeLeiModel.findByIdAndUpdate(
    { _id: projectId },
    { "meta.thread": thread.id }
  );

  return thread;
}
