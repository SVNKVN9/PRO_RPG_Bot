import { ChannelType, CommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";
import { ItemBase, ItemParameter, ItemsType, StatusType } from '..//../types'

export default {
    data: [
        new SlashCommandBuilder()
            .setName('build')
            .setDescription('build')
            .addStringOption(option => option
                .setName('ไอเทมไอดี')
                .setDescription('ระบุไอเทมไอดีที่ต้องการใช้')
                .setRequired(true)
            )
            .addChannelOption(option => option
                .setName('ช่อง')
                .setDescription('ระบุช่องที่ต้องการใช้')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)
            )
    ],

    execute: async (client: Client, interaction: CommandInteraction) => {
        await interaction.deferReply({ ephemeral: true })

        const Member = interaction.guild?.members.cache.get(interaction.user.id) || await interaction.guild?.members.fetch(interaction.user.id) as GuildMember

        const ItemId = interaction.options.get('ไอเทมไอดี')?.value as string

        const Item = await client.Database.Items(ItemId) as ItemsType

        if (!Item) return interaction.editReply({ content: '❌ไม่พบไอเทมในระบบ' })

        const Select = await client.Database.Inventorys.findOne({ UserId: interaction.user.id, ItemId }) as any as ItemBase

        const { UserId, ItemDate, ItemCount } = Select

        try {
            await interaction.editReply({ content: '**กำลังทำงาน**', embeds: [], components: [] })

            const command: {
                default: (ItemParameter: ItemParameter) => Promise<StatusType>
            } = require(`../../handlers/Item/Type/F`)

            if (Select.Locked) return await interaction.editReply({ content: '❌ **คุณกำลังใช้ไอเทมนี้อยู่**' })

            await client.Database.Inventorys.updateOne({ UserId, ItemId, ItemDate, ItemCount }, { $set: { Select: false, Locked: true } })

            const result = await command.default({
                client: client,
                Member: Member,
                ItemTarget: Select,
                interaction: interaction as any,
                Target: undefined,
                AcceptCheck: undefined,
            })

            await client.Database.Inventorys.updateOne({ UserId, ItemId, ItemDate, ItemCount }, { $set: { Select: true, Locked: false } })

            if (result.message) return interaction.editReply(result.message)
        } catch (err) {
            console.log(err)

            await client.Database.Inventorys.updateOne({ UserId, ItemId, ItemDate, ItemCount }, { $set: { Locked: false } })

            client.log.try_catch_Handling('🔴', `ItemExecute (${UserId} | ${ItemId}): ${err}`)

            return interaction.editReply({ content: `เกิดข้อผิดพลาด: ${err}` })
        }
    }
}