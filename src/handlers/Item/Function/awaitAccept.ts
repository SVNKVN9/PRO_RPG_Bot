import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder } from "discord.js"
import { StatusType } from "../../../types"

export default async (interaction: CommandInteraction, TargetId: string, ItemName: string): Promise<StatusType> => {
    const AcceptMessage = await interaction.channel?.send({
        embeds: [
            new EmbedBuilder()
                .setTitle(`🟡 ยอมรับการ ป้อน หรือไม่`)
                .setColor('Yellow')
                .setDescription(`<@${TargetId}> ยอมรับการ ป้อน ( ${ItemName} ) จาก <@${interaction.user.id}> หรือไม่`)
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(`✅ยอมรับ✅`)
                        .setCustomId('accept')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setLabel('❌ไม่ยอมรับ❌')
                        .setCustomId('decline')
                        .setStyle(ButtonStyle.Danger)
                )
        ]
    })

    const AcceptInteraction = await AcceptMessage?.awaitMessageComponent({
        filter: (inter) => inter.user.id == TargetId,
        time: 60_000
    })

    if (!AcceptInteraction) return { isEnd: true }
    if (!AcceptInteraction.isButton()) return { isEnd: true }

    await AcceptInteraction.deferUpdate()

    if (AcceptInteraction.customId == 'decline') {
        AcceptMessage?.edit({
            embeds: [
                new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription(`ยกเลิกการใช้ไอเทมจาก ${interaction.user.id}`)
            ],
            components: []
        })

        return { isEnd: true }
    }

    if (AcceptInteraction.customId != 'accept') return { isEnd: true }

    await AcceptMessage?.delete()

    return { isEnd: false }
}