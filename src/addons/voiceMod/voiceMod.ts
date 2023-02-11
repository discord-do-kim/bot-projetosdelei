import { VOICE_CASTIGO_CHANNEL } from "../../config";
import { Interaction, ContextMenuCommandBuilder, ApplicationCommandType, CacheType, Snowflake, User } from "discord.js";
import { CommandPattern } from "../../commands/CommandPattern";

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
    // command = new SlashCommandBuilder()
    //     .setName("cronometross")
    //     .setDescription("Funcionalidades para o Cronômetro")
    //     .addSubcommand((sub) =>
    //         sub
    //             .setName("xurileibs")
    //             .setDescription("filtrar pelo id do projeto.")
    //     );

    // async execute(interaction: Interaction): Promise<void> {
    //     if (!interaction.isChatInputCommand()) return;
    //     const command = interaction.options.getSubcommand(true);

    //     switch (command) {
    //         case "xurileibs": {
    //             await this.ping(interaction);
    //             break;
    //         }
    //         default: {
    //             await interaction.reply(
    //                 "Não foi possível encontrar essa funcionalidade."
    //             );
    //             break;
    //         }
    //     }
    // }

    // async ping(interaction: ChatInputCommandInteraction): Promise<void> {
    //     await interaction.reply({ content: "Pong", ephemeral: false });
    //     return;
    // }
}