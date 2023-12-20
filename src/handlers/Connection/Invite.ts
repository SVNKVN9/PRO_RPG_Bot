import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, VoiceState } from "discord.js"
import Client from "../../structure/Client"
import { IUser, InviteVoice } from "../../types"

export const InviteJoin = async (client: Client, newState: VoiceState, channel: InviteVoice, user: IUser, TSP: number) => {
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

        setTimeout(() => message?.delete(), Time)

        const isCancel = await message?.awaitMessageComponent({
            filter: (interaction) => interaction.user.id == newState.member?.id,
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
    } catch { }

    client.Connection.travel.delete(newState.id)

    if (client.Connection.voiceConnection.get(newState.id) != channel.channelId) return

    try {
        const invites = newState.guild.invites
        let Invite = (await invites.fetch({ channelId: channel.channelInvite })).find((invite, key) => invite.inviter?.id == newState.client.user.id)

        if (!Invite) Invite = await newState.guild.invites.create(channel.channelInvite)

        const isInvite = await client.Database.Invites.find({ userId: newState.member?.id }).toArray()

        const Insert = async () => await client.Database.Invites.insertOne({
            toGuildId: Invite?.guild?.id,
            fromGuildId: newState.guild.id,
            userId: newState.member?.id,
            roleId: channel.giveId
        })


        if (!isInvite) Insert()
        else {
            await client.Database.Invites.deleteMany({ userId: newState.member?.id })

            Insert()
        }

        const DM = await newState.member?.createDM()

        DM?.send({
            content: Invite.url
        })


    } catch (err) {
        client.log.try_catch_Handling('🔴', `Create Invite has Error | ${err}`)
    }
}