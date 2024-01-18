/* eslint-disable */
// Isso aqui vai rapar fora jaja. Ngm usa. Só embronhação.

import { VOICE_CASTIGO_CHANNEL } from "../config";
import { Interaction, ContextMenuCommandBuilder, ApplicationCommandType, CacheType, Snowflake, User } from "discord.js";
import { CommandPattern } from "./CommandPattern";

export class VoiceMod extends CommandPattern {
    command = new ContextMenuCommandBuilder()
    .setName("@ Castigo de Voice")
    .setType(ApplicationCommandType.User);

    async execute(interaction: Interaction, ...args: any[]): Promise<any> {
        if (!interaction.isUserContextMenuCommand()) return;
        const moduser = interaction.user
        const targetUser = interaction.targetUser
        await this.moveToVoiceChannel(interaction, targetUser, VOICE_CASTIGO_CHANNEL)
        await this.moveToVoiceChannel(interaction, moduser, VOICE_CASTIGO_CHANNEL)
        return;
    }
    
    async moveToVoiceChannel(interaction: Interaction<CacheType>, targetUser: User, channelID: Snowflake): Promise<any> {
        if (!interaction.isUserContextMenuCommand()) return;
        const guild = interaction.guild;
        if (!guild) return;
        const member = await guild.members.fetch(targetUser);
        if (!member.voice.channel) return;
        // return if member is already in the target channel
        if (member.voice.channelId === channelID) return;
        // move member to the target channel
        await member.voice.setChannel(channelID);
    }
}
