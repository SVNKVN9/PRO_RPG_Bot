import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, VoiceState } from "discord.js"
import Client from "../../structure/Client"
import { SimpleVoice, IUser } from "../../types"

export const SimpleJoin = async (client: Client, newState: VoiceState, channel: SimpleVoice, user: IUser, TSP: number) => {
    const Time = channel.delay ? (channel.delay / (TSP / 100)) * 1000 : 0
    const errors = []

    if (channel.itemId) {
        const isEquips = await client.Database.Equips.find({ UserId: newState.id, ItemId: channel.itemId }).toArray()

        if (!isEquips.length) errors.push(`**Item Required** คุณไม่มีไอเทม ${channel.itemId}`)
    }

    if (channel.level) {
        const [Min, Max] = channel.level.split("-").sort((a, b) => parseInt(a) - parseInt(b))

        if (
            parseInt(Min.trim()) > user.stats.level ||
            parseInt(Max.trim()) < user.stats.level
        ) errors.push(`**Level Required** ต้องมีเวลาระหว่าง ${channel.level}`)
    }

    if (channel.roleId) {
        const role = newState.guild.roles.cache.get(channel.roleId)

        if (!newState.member?.roles.cache.has(channel.roleId)) errors.push(`**Role Required** คุณไม่มีบทบาท ${role?.name}`)
    }

    if (errors.length) return

    client.Connection.travel.set(newState.id, true)

    try {
        const message = await newState.member?.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`<@${newState.id}> 🏃‍♂️ กำลังเดินทาง <#${newState.channelId}>\nใช้เวลาประมาณ <t:${Math.round((Date.now() / 1000) + (Time / 1000))}:R>`)
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(`ยกเลิกการเดินทาง`)
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(`cancel`)
                    )
            ]
        })

        console.log(Time)

        setTimeout(() => message?.delete(), Time)

        const isCancel = await message?.awaitMessageComponent({
            filter: (interaction) => interaction.user.id == newState.id,
            time: Time
        })

        if (isCancel && isCancel.isButton()) {
            await isCancel.deferUpdate()

            client.Connection.travel.delete(newState.id)

            return message?.edit({
                embeds: [new EmbedBuilder().setDescription(`❌ ยกเลิกการเดินทางแล้ว`)],
                components: []
            })
        }
    } catch {  }

    client.Connection.travel.delete(newState.id)

    if (client.Connection.voiceConnection.get(newState.id) != channel.channelId) return

    if (channel.giveId) {
        const role = newState.guild.roles.cache.get(channel.giveId)

        if (!role) return

        await newState.member?.roles.add(role)
    }

    if (channel.takeId) {
        const role = newState.guild.roles.cache.get(channel.takeId)

        if (!role) return

        await newState.member?.roles.remove(role)
    }

    try {
        if (!channel.description) return

        const message = await newState.member?.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`${channel.description}`)
            ]
        })

        setTimeout(() => message?.delete(), 1000 * 60 * 3)
    } catch (err) {
        client.log.try_catch_Handling('🔴', `Connection - Simple (87 - 97) | ${err}`)
    }
}