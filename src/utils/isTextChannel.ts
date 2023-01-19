import { Channel, TextChannel } from "discord.js";

export function isTextChannel(channel: Channel): channel is TextChannel {
  if (
    !channel.isTextBased() ||
    channel.isVoiceBased() ||
    channel.isThread() ||
    channel.isDMBased()
  )
    return false;
  return true;
}
