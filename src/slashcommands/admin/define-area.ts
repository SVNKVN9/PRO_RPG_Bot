import { CommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, codeBlock } from "discord.js";
import Client from "../../structure/Client";
import { TypeF } from "../../types";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('define-area')
            .setDescription('DefineArea')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addIntegerOption(option => option
                .setName('size')
                .setDescription('ขนาด')
                // .setRequired(true)
            )
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        const size = interaction.options.get('size')?.value

        if (!client.config.OnwerIds.includes(interaction.user.id)) return interaction.reply({ content: 'คุณไม่มีสิทธิในการใช้คำสั่งนี้' })

        const isChannel = await client.Database.FarmChannels.findOne({ Id: interaction.channelId })

        if (isChannel) {
            const Farms = await client.Database.Farm.find({ ChannelId: interaction.channelId }).toArray()

            const Items = await Promise.all(Farms.map(async Farm => await client.Database.Items(Farm.ItemId))) as TypeF[]

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`🌱🌱  พื้นที่เพาะปลูก  🌱🌱`)
                        .addFields({
                            name: `ขนาดพื่้นที่คงเหลื่อ`,
                            value: codeBlock(`${isChannel.size - Items.reduce((p, c) => p + parseInt(c.FarmProperties.Area as string), 0) } ช่อง`)
                        })
                ]
            })
        }

        if (!size) return interaction.reply({ content: '**❌ คุณไม่ได้ระบุพื้นที่ปลูก**' })

        await client.Database.FarmChannels.insertOne({ Id: interaction.channelId, size: size, FarmIds: [] })

        interaction.reply({ content: '✅ ช่องนี้สามารถปลูกได้แล้ว' })
    }
}