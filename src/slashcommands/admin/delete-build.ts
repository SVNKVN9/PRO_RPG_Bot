import { CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";
import { FarmOptions } from "../../types";

export default {
    data: [
        new SlashCommandBuilder()
        .setName('delete-build')
        .setDescription('delete farm')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option
            .setName('message-id')
            .setDescription('id ข้อความ')
            .setRequired(true)
        )
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        const messageId = interaction.options.get('message-id')?.value

        if (!client.config.OnwerIds.includes(interaction.user.id)) return interaction.reply({ ephemeral: true, content: 'คุณไม่มีสิทธิในการใช้คำสั่งนี้' })

        const farm: FarmOptions = await client.Database.Farm.findOne({ MessageId: messageId }) as any

        if (!farm) return interaction.reply({ ephemeral: true, content: 'ไม่พบฟาร์ม' })

        await client.Database.FarmChannels.updateOne({ Id: farm.ChannelId }, { $pull: { FarmIds: farm.Id } })
        
        await client.Database.Farm.deleteOne({ Id: farm.Id })

        const FarmChannel = client.channels.cache.get(farm.ChannelId)

        if (FarmChannel?.isTextBased()) {
            const msg = await FarmChannel.messages.fetch(farm.MessageId)

            await msg.delete()
        }

        return interaction.reply({ ephemeral: true, content: '✅ ลบฟาร์มสำเร็จ' })
    }
}