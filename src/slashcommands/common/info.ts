import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('info')
            .setDescription('ดูข้อมูลไอเทม')
            .addStringOption(option => option.setName('ไอเทมไอดี').setDescription('ไอเทมไอดี').setRequired(true))
    ],

    execute: async (client: Client, interaction: CommandInteraction) => {
        const ItemId = interaction.options.get('ไอเทมไอดี')?.value as string

        // const result = await InfoExecute(client, interaction.user.id, ItemId) as InteractionReplyOptions

        // return interaction.reply({ ...result, ephemeral: true })
    }
}