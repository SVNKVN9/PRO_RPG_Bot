import { CommandInteraction } from 'discord.js'
import starter from '../../handlers/package/starter'
import Command from '../../handlers/package/Structure'
import Client from '../../structure/Client'

export default {
    data: [Command],
    execute: async (client: Client, interaction: CommandInteraction) => {
        const packageName = interaction.options.data[0].name

        if (!client.config.OnwerIds.includes(interaction.user.id)) return interaction.reply({ ephemeral: true, content: 'คุณไม่มีสิทธิใช้คำสั่งนี้' })

        if (packageName == 'starter') {
            return starter(client, interaction)
        }
    }
}