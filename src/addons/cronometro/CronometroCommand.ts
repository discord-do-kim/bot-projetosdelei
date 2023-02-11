import { SlashCommandBuilder, Interaction, ChatInputCommandInteraction, ActionRowBuilder } from "discord.js";
import { CommandPattern } from "../../commands/CommandPattern";

export class CronometroCommand extends CommandPattern {
    command = new SlashCommandBuilder()
        .setName("cronometro")
        .setDescription("Funcionalidades para o Cronômetro")
        .addSubcommand((sub) =>
            sub
                .setName("xurileibs")
                .setDescription("filtrar pelo id do projeto.")
        );

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.options.getSubcommand(true);

        switch (command) {
            case "xurileibs": {
                await this.ping(interaction);
                break;
            }
            default: {
                await interaction.reply(
                    "Não foi possível encontrar essa funcionalidade."
                );
                break;
            }
        }
    }

    async ping(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({ content: "Pong", ephemeral: false });
        return;
    }
}