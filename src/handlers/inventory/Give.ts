import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, GuildMember, } from "discord.js";
import Client from "../../structure/Client";
import { InventoryBuild } from "../../Utils/Components";
import SelectUser from "./SelectUser";
import { ILevel, IUser, ItemBase } from "../../types";
import Calculator from "../../Utils/Calculator";
import CP_Process from "./Function/CP_Process";

export default async (client: Client, interaction: ButtonInteraction, Select: ItemBase[]) => {
    const Member = interaction.guild?.members.cache.get(interaction.user.id) || await interaction.guild?.members.fetch(interaction.user.id)

    const InventoryFields = await InventoryBuild(client, Select)

    const ReceiverId = await SelectUser({
        interaction,
        Member: Member as GuildMember,
        InventoryFields,
        deleteInteraction: true,
        Embed: new EmbedBuilder()
            .setTitle('✅ เลือกคนที่ต้องการให้')
            .setDescription('**รายการไอเทมทั้งหมดที่ต้องการให้**')
    })

    if (!ReceiverId) return

    const MemberId = Member?.id

    // Verify
    const VerifyMessage = await interaction.channel?.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('✅ ตรวจสอบการให้ 🎁')
                .addFields(
                    ...InventoryFields,
                    {
                        name: '\u200b',
                        value: `🎁 ให้ไอเทมกับ <@${ReceiverId}>`
                    }
                )
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm')
                        .setLabel('✅ยืนยัน✅')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('cancel')
                        .setLabel('❌ยกเลิก❌')
                        .setStyle(ButtonStyle.Danger)
                )
        ]
    })

    const VerifyInteraction = await VerifyMessage?.awaitMessageComponent({
        filter: (inter) => inter.user.id == MemberId,
        time: 60_000
    })

    if (!VerifyInteraction) return

    await VerifyInteraction.deferUpdate()

    if (VerifyInteraction.customId == 'cancel') return VerifyMessage?.edit({ embeds: [], components: [], content: `❌ <@${MemberId}> ได้มีการยกเลิกการให้ของกับ <@${ReceiverId}>` })

    if (VerifyInteraction.customId != 'confirm') return

    // Accept
    const AcceptMessage = await VerifyMessage?.edit({
        embeds: [
            new EmbedBuilder()
                .setTitle('✅ ตรวจสอบการให้ 🎁')
                .setDescription(`❓<@${ReceiverId}> ยอมรับการให้ไอเทมจาก <@${MemberId}> หรือไม่`)
                .addFields(...InventoryFields)
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

    const AcceptInteraction = await AcceptMessage?.awaitMessageComponent({
        filter: (inter) => inter.user.id == ReceiverId,
        time: 60_000
    })

    if (!AcceptInteraction) return

    await AcceptInteraction.deferUpdate()

    if (AcceptInteraction.customId == 'decline') return AcceptMessage?.edit({ embeds: [], components: [], content: `❌ <@${ReceiverId}> ไม่ยอมรับไอเทมจาก <@${MemberId}>` })

    if (AcceptInteraction.customId != 'accept') return

    await AcceptMessage?.edit({ embeds: [new EmbedBuilder().setDescription('**กำลังให้ไอเทม**')], components: [] })

    const receiverInventory = await client.Database.Inventorys.find({ UserId: ReceiverId }).toArray() as any as ItemBase[]
    const receiverData = await client.Database.Users.findOne({ UserId: ReceiverId }) as any as IUser
    const receiverLevel = await client.Database.Level.findOne({ LevelNo: receiverData.stats.level.toString() }) as any as ILevel

    try {
        const CAP_need = await CP_Process(client, Select)
        const TargetCP = await CP_Process(client, receiverInventory)
        const { CP } = await Calculator(client, receiverData, receiverLevel)

        if ((CAP_need + TargetCP) > CP) return AcceptMessage?.edit({ embeds: [], components: [], content: `❌ <@${ReceiverId}> คุณมีพื้นที่เก็บไม่เพียงพอ` })

        await Promise.all(Select.map(async Item => await client.Database.Inventorys.updateOne({
            UserId: MemberId,
            ItemCount: Item.ItemCount,
            ItemDate: Item.ItemDate,
            ItemId: Item.ItemId
        }, {
            $set: {
                UserId: ReceiverId,
                Select: false
            }
        })))

        return AcceptMessage?.edit({
            embeds: [
                new EmbedBuilder()
                    .setTitle('✅ สรุปการให้สำเร็จ 🎁')
                    .addFields(
                        ...InventoryFields,
                        {
                            name: '\u200b',
                            value: `🎁 ให้ไอเทมกับ <@${ReceiverId}>`
                        }
                    )
            ],
            components: []
        })
    } catch (err) {
        return AcceptMessage?.edit({ embeds: [], components: [], content: `**เกิดข้อผิดพลาด** ${err}` })
    }
}