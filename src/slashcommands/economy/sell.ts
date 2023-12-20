import { CommandInteraction, SlashCommandBuilder, User } from "discord.js";
import { ILevel, ItemBase, ItemsType, IUser } from '../../types'
import Client from "../../structure/Client";
import Calculator from "../../Utils/Calculator";
import { ErrorEmbeds, SellEmbeds } from "../../Utils/Components";
import { isDecimal } from "../../Utils/Function";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('sell')
            .setDescription('ขายไอเทม')
            .addUserOption(option => option.setName('ผู้ซื้อ').setDescription('ระบุผู้ซื้อ').setRequired(true))
            .addNumberOption(option => option.setName('จำนวน').setDescription('ระบุจำนวนที่ต้องการขาย').setRequired(true).setMinValue(1))
            .addStringOption(option => option.setName('ไอดีไอเทม').setDescription('ระบุไอดีไอเทมที่ต้องการขาย').setRequired(true))
            .addNumberOption(option => option.setName('ราคา').setDescription('ระบุราคาที่ต้องการขาย').setRequired(true).setMinValue(0))
    ],

    execute: async (client: Client, interaction: CommandInteraction) => {
        const target = interaction.options.getUser('ผู้ซื้อ') as User
        const count = parseFloat(interaction.options.get('จำนวน')?.value as string)
        const ItemId = interaction.options.get('ไอดีไอเทม')?.value as string
        const price = parseFloat(interaction.options.get('ราคา')?.value as string)

        await interaction.deferReply()

        if (!isDecimal(price)) return interaction.editReply({ embeds: [ErrorEmbeds.InvalidNumber()] })
        if (!isDecimal(count)) return interaction.editReply({ embeds: [ErrorEmbeds.InvalidNumber()] })

        const Member = await interaction.guild?.members.fetch(interaction.user.id)
        const Target = await interaction.guild?.members.fetch(target.id)

        if (interaction.user.id == target.id) return interaction.editReply({ embeds: [ErrorEmbeds.ActionSelf()] })

        if (!Member?.voice.channel) return interaction.editReply({ embeds: [ErrorEmbeds.NotVoiceChannel()] })
        if (Member?.voice.channelId != Target?.voice.channelId) return interaction.editReply({ embeds: [ErrorEmbeds.ChannelNotMatch(Target?.user.id)] })

        const targetData: IUser = await client.Database.Users.findOne({ UserId: target.id }) as any
        const targetlevel: ILevel = await client.Database.Level.findOne({ LevelNo: targetData.stats.level.toString() }) as any

        const Inventory: ItemBase[] = await client.Database.Inventorys.find({ UserId: interaction.user.id }).toArray() as any
        const TargetInventory: ItemBase[] = await client.Database.Inventorys.find({ UserId: target.id }).toArray() as any

        let isItem = Inventory.filter(item => item.ItemId == ItemId).sort((a, b) => a.CreateTimestramp - b.CreateTimestramp).sort((a, b) => a.ItemCount - b.ItemCount)

        if (isItem.length == 0) return interaction.editReply({ embeds: [ErrorEmbeds.DontHasItem()] })

        const Item = await client.Database.Items(ItemId) as ItemsType 

        // if (Item.Base.NotTrade) return interaction.editReply({ embeds: [ErrorEmbeds.NotTrade(Item.Base.ItemId, Item.Base.ItemName)] })

        let Arraytext = []

        for (let i = 0; i < count; i++) {
            if (isItem[i].Locked) return interaction.editReply({ content: `❌ **คุณกำลังใช้ไอเทมนี้อยู่**` })

            Arraytext.push(`${i + 1}. ${isItem[i].ItemId}-${isItem[i].ItemDate}-${isItem[i].ItemCount}\n`)
        }

        await interaction.deleteReply()

        const message = await interaction.channel?.send(SellEmbeds.Confirm(Member, Target, Item, Arraytext, count.toString(), price.toString()))

        const inter = await interaction.channel?.awaitMessageComponent({ time: 300_000, filter: (inter) => inter.user.id == target.id })

        inter?.deferUpdate()

        if (!inter) return message?.edit({ embeds: [], components: [], content: `❌ <@${target.id}> <@${interaction.user.id}> หมดเวลาการ **ซื้อ / ขาย**` })

        if (inter.customId == 'cancel') return message?.edit({ embeds: [], components: [], content: `❌ <@${target.id}> ได้มีการยกเลิกการขายกับ <@${interaction.user.id}>` })

        if (inter.customId != 'confirm') return

        if ((targetData.cash - price) < 0) return message?.edit({ embeds: [ErrorEmbeds.NotCash(target.id)], components: [] })

        await message?.edit({ embeds: [], components: [], content: '**กำลังขาย**' })

        try {
            let pull = []
            let Items = []

            for (let i = 0; i < count; i++) {
                pull.push(isItem[i])
                Items.push(`${i + 1}. ${isItem[i].ItemId}-${isItem[i].ItemDate}-${isItem[i].ItemCount}\n`)
            }

            const ItemData = await client.Database.Items(ItemId) as any

            const CAP_need = parseInt(ItemData.Base.Size ? ItemData.Base.Size : 1) * pull.length

            const { CP } = await Calculator(client, targetData, targetlevel)

            const result = await Promise.all(TargetInventory.map(async (item) => await client.Database.Items(item.ItemId) as any))

            const TotelCP = result.length == 0 ? 0 : result.reduce((p, c) => {
                try {
                    return p + (c.Base.Size ? parseInt(c.Base.Size) : 1)
                } catch (err) {
                    client.log.try_catch_Handling('🔴', `Sell Command Error: ${err}`)

                    return p + 1
                }
            })

            if ((CAP_need + TotelCP) > CP) return message?.edit({ embeds: [], components: [], content: `❌ <@${target.id}> คุณมีพื้นที่เก็บไม่เพียงพอ` })

            await Promise.all([
                await client.Database.Users.updateOne({ UserId: target.id }, { $inc: { cash: -price } }),
                await client.Database.Users.updateOne({ UserId: interaction.user.id }, { $inc: { cash: price } }),
                await Promise.all(pull.map(async (item) => await client.Database.Inventorys.updateOne({
                    UserId: interaction.user.id,
                    ItemCount: item.ItemCount,
                    ItemDate: item.ItemDate,
                    ItemId: item.ItemId
                },
                    {
                        $set: { UserId: target.id }
                    }))),
                await message?.edit({ embeds: [SellEmbeds.Complete(Member, Target, ItemData, Items, count.toString(), price.toString())], content: '' })
            ])
        } catch (err) {
            return message?.edit({ embeds: [], components: [], content: `**เกิดข้อผิดพลาด** ${err}` })
        }
    }
}