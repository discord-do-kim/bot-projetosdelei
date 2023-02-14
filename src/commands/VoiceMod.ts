import { VOICE_CASTIGO_CHANNEL } from "../config";
import { Interaction, ContextMenuCommandBuilder, ApplicationCommandType, CacheType, Snowflake, User, GuildMember } from "discord.js";
import { CommandPattern } from "./CommandPattern";

export class VoiceMod extends CommandPattern {
    command = new ContextMenuCommandBuilder()
    .setName("@ Castigo de Voice")
    .setType(ApplicationCommandType.User);

    async execute(interaction: Interaction, ...args: any[]): Promise<any> {
        if (!interaction.isUserContextMenuCommand()) return;
        let moduser = interaction.user
        let targetUser = interaction.targetUser
        let original_channel = interaction.channelId // we'll use it later
        await this.moveToVoiceChannel(interaction, targetUser, VOICE_CASTIGO_CHANNEL)
        await this.moveToVoiceChannel(interaction, moduser, VOICE_CASTIGO_CHANNEL)
        return;
    }
    
    async moveToVoiceChannel(interaction: Interaction<CacheType>, targetUser: User, channelID: Snowflake): Promise<any> {
        if (!interaction.isUserContextMenuCommand()) return;
        let guild = interaction.guild;
        if (!guild) return;
        let member = await guild.members.fetch(targetUser);
        if (!member.voice.channel) return;
        // return if member is already in the target channel
        if (member.voice.channelId === channelID) return;
        // move member to the target channel
        await member.voice.setChannel(channelID);
    }
}
