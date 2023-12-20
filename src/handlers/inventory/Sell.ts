import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, GuildMember, Message, codeBlock } from "discord.js";
import Client from "../../structure/Client";
import { ErrorEmbeds, InventoryBuild, NumberInput } from "../../Utils/Components";
import { ILevel, IUser, ItemBase } from "../../types";
import Calculator from "../../Utils/Calculator";
import SelectUser from "./SelectUser";
import { NumberWithCommas } from "../../Utils/Function";
import CP_Process from "./Function/CP_Process";

export default async (client: Client, interaction: ButtonInteraction, Select: ItemBase[]) => {
    const Seller = await interaction.guild?.members.fetch(interaction.user.id)

    const InventoryFields = await InventoryBuild(client, Select)

    // wait for Select User
    const BuyerId = await SelectUser({
        interaction,
        Member: Seller as GuildMember,
        InventoryFields,
        Embed: new EmbedBuilder()
            .setTitle('✅ เลือกคนที่ต้องการขายให้')
            .setDescription('**💰 รายการไอเทมทั้งหมดที่ต้องการขาย**')
    })

    if (!BuyerId) return

    const SellerId = Seller?.id

    // Build Embed for Price Input
    const PriceInputEmbed = (Price: string[]) => new EmbedBuilder()
        .setTitle('✅ กำหนดราคาขาย')
        .setDescription(`📑รายการไอเทมทั้งหมดที่ต้องการขาย`)
        .addFields(
            ...InventoryFields,
            {
                name: '😊 ขายให้กับ',
                value: `<@${BuyerId}>`
            },
            {
                name: '💰 ราคา',
                value: codeBlock(`${NumberWithCommas(parseInt(Price.toString().replace(/,/g, '')))} แกน`)
            }
        )


    const PriceArr: string[] = []

    const PriceMessage = await interaction.editReply({
        embeds: [PriceInputEmbed(PriceArr)],
        components: [...NumberInput()]
    })

    // Price Input for Sell
    const PriceInput = async (PriceMessage: Message | undefined): Promise<boolean | undefined> => {
        const interaction = await PriceMessage?.awaitMessageComponent({
            filter: (inter) => inter.user.id == SellerId,
            time: 60_000
        })

        if (!interaction) return false
        if (!interaction.isButton()) return false

        await interaction.deferUpdate()

        if (interaction.customId == 'delete') {
            PriceArr.pop()

            interaction.editReply({ embeds: [PriceInputEmbed(PriceArr)] })

            return await PriceInput(PriceMessage)
        }

        if (interaction.customId == 'confirm') return true

        if (interaction.customId == '000') {
            PriceArr.push('0')
            PriceArr.push('0')
            PriceArr.push('0')
        }

        const Number = parseInt(interaction.customId)

        if (isNaN(Number)) return false

        PriceArr.push(interaction.customId)

        interaction.editReply({ embeds: [PriceInputEmbed(PriceArr)] })

        return await PriceInput(PriceMessage)
    }

    await PriceInput(PriceMessage)

    await interaction.deleteReply()

    // Message Accept or Unaccpet for Buyer
    const ConfirmMessage = await interaction.channel?.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('🔂 ยอมรับซื้อขายไอเทมหรือไม่ 🔂')
                .setDescription(`<@${BuyerId}>ยอมรับการขายจาก<@${SellerId}>หรือไม่`)
                .addFields(
                    ...InventoryFields,
                    {
                        name: '💰 ราคา',
                        value: codeBlock(`${NumberWithCommas(parseInt(PriceArr.toString().replace(/,/g, '')))} แกน`)
                    }
                )
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept')
                        .setLabel('✅ยอมรับ✅')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('decline')
                        .setLabel('❌ไม่ยอมรับ❌')
                        .setStyle(ButtonStyle.Danger)
                )
        ]
    })

    const Price = PriceArr.length == 0 ? 0 : parseInt(PriceArr.toString().replace(/,/g, '')) ?? 0

    const ConfirmInteraction = await ConfirmMessage?.awaitMessageComponent({
        filter: (inter) => inter.user.id == BuyerId,
        time: 60_000
    })

    if (!ConfirmInteraction) return ConfirmMessage?.edit({ embeds: [], components: [], content: `❌ <@${BuyerId}> <@${interaction.user.id}> หมดเวลาการ **ซื้อ / ขาย**` })

    await ConfirmInteraction.deferUpdate()

    if (ConfirmInteraction.customId == 'decline') return ConfirmMessage?.edit({ embeds: [], components: [], content: `❌ <@${BuyerId}> ได้มีการยกเลิกการขายกับ <@${interaction.user.id}>` })

    if (ConfirmInteraction.customId != 'accept') return

    const BuyerData = await client.Database.Users.findOne({ UserId: BuyerId }) as any as IUser
    const BuyerLevel = await client.Database.Level.findOne({ LevelNo: BuyerData.stats.level.toString() }) as any as ILevel

    if (((isNaN(BuyerData.cash) ? 0 : BuyerData.cash) - Price) < 0) return ConfirmMessage?.edit({ embeds: [ErrorEmbeds.NotCash(BuyerId)], components: [] })

    await ConfirmMessage?.edit({ embeds: [], components: [], content: '**กำลังขาย**' })

    const BuyerInventory = await client.Database.Inventorys.find({ UserId: BuyerId }).toArray() as any as ItemBase[]

    try {
        const CAP_need = await CP_Process(client, Select)
        const BuyerCP = await CP_Process(client, BuyerInventory)
        const { CP } = await Calculator(client, BuyerData, BuyerLevel)

        if ((CAP_need + BuyerCP) > CP) return ConfirmMessage?.edit({ embeds: [], components: [], content: `❌ <@${BuyerId}> คุณมีพื้นที่เก็บไม่เพียงพอ` })

        await Promise.all([
            await client.Database.Users.updateOne({ UserId: BuyerId }, { $inc: { cash: -Price } }),
            await client.Database.Users.updateOne({ UserId: SellerId }, { $inc: { cash: Price } }),
            await Promise.all(Select.map(async (item) => await client.Database.Inventorys.updateOne({
                UserId: SellerId,
                ItemCount: item.ItemCount,
                ItemDate: item.ItemDate,
                ItemId: item.ItemId
            },
                {
                    $set: { UserId: BuyerId, Select: false }
                }))),
            await ConfirmMessage?.edit({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`✅ สรูปการซื้อขายสำเร็จ 🔂`)
                        .setDescription(`💸 ผู้ขาย <@${SellerId}>`)
                        .addFields(
                            ...InventoryFields,
                            {
                                name: '\u200b',
                                value: `🎁 ผู้ซื้อ <@${BuyerId}>`
                            },
                            {
                                name: '💰 ราคา',
                                value: codeBlock(`${NumberWithCommas(Price)} แกน`)
                            }
                        )
                ],
                content: ''
            })
        ])
    } catch (err) {
        return ConfirmMessage?.edit({ embeds: [], components: [], content: `**เกิดข้อผิดพลาด** ${err}` })
    }
}