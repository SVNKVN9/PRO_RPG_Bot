import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";
import Inventory from "../../handlers/inventory/Inventory";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('inventory')
            .setDescription('มิติเก็บไอเทม')
            .addStringOption(option => option
                .setName('show')
                .setDescription('ต้องการแสดงให้คนอื่นเห็นไหม')
                .addChoices(
                    {
                        name: 'ไม่แสดง',
                        value: 'true'
                    },
                    {
                        name: 'แสดง',
                        value: 'false'
                    }
                )
                .setRequired(false)
            )
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        const ephemeral = (interaction.options.get('show')?.value === undefined) ? true : (interaction.options.get('show')?.value == 'true')

        await interaction.deferReply({ ephemeral: ephemeral })

        new Inventory(client, interaction.user.id, interaction)
    }
}

