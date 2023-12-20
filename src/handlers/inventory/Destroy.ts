import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Embed, EmbedBuilder } from "discord.js";
import Client from "../../structure/Client";
import { ItemBase } from "../../types";
import { InventoryBuild } from "../../Utils/Components";

export default async (client: Client, interaction: ButtonInteraction, Select: ItemBase[]) => {
    const Destroy = await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setTitle('⚠️คุณแน่ใจใช้ไหม ที่จะทำลายไอเทมที่เลือกทั้งหมดนี้')
                .addFields(await InventoryBuild(client, Select))
                .setFooter({ text: "❗หมายเหตุ : ถ้ากดปุ่มยืนยันการทำลายแล้ว ไอเทมจะหายไปจะระบบ ไม่สามารถกู้คืนได้" })
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('cancel')
                        .setLabel('ยกเลิกการทำลาย')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('confirm')
                        .setLabel('ยืนยันการทำลาย')
                        .setStyle(ButtonStyle.Danger),
                )
        ]
    })

    const DestroyInteraction = await Destroy.awaitMessageComponent({
        filter: (inter) => inter.user.id == interaction.user.id,
        time: 60_000
    }).catch(() => {})

    if (!DestroyInteraction) return
    if (!DestroyInteraction.isButton()) return

    DestroyInteraction.deferReply({ ephemeral: true })

    if (DestroyInteraction.customId == 'cancel') return await DestroyInteraction.editReply({ content: '**ยกเลิกการทำลายแล้ว**' })

    await Promise.all(Select.map(async ({ UserId, ItemId, ItemCount, ItemDate }) => await client.Database.Inventorys.deleteOne({ UserId, ItemId, ItemCount, ItemDate })))

    await DestroyInteraction.editReply({ content: '**ทำลายไอเทมาสำเร็จแล้ว**' })
}