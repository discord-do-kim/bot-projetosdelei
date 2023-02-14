import { VOICE_CASTIGO_CHANNEL } from "../config";
import { Interaction, ContextMenuCommandBuilder, ApplicationCommandType, CacheType, Snowflake, User } from "discord.js";
import { CommandPattern } from "./CommandPattern";

export class VoiceMod extends CommandPattern {
    command = new ContextMenuCommandBuilder()
    .setName("! Castigo de Voice !")
    .setType(ApplicationCommandType.User);

    async execute(interaction: Interaction<CacheType>, ...args: any[]): Promise<any> {
        if (!interaction.isUserContextMenuCommand()) return;
        let moduser = interaction.user
        let targetUser = interaction.targetUser
        let original_channel = interaction.channelId
        await this.moveToVoiceChannel(interaction, targetUser, VOICE_CASTIGO_CHANNEL)
        await this.moveToVoiceChannel(interaction, moduser, VOICE_CASTIGO_CHANNEL)
        return;
    }
    
    async moveToVoiceChannel(interaction: Interaction<CacheType>, targetUser: User, channelID: Snowflake): Promise<any> {
       let user = await interaction.guild?.members.fetch({ user: targetUser})
       user?.voice.setChannel(channelID)
       return;

    }
