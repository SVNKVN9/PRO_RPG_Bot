import { GuildMember, VoiceState } from "discord.js";
import Client from "../../structure/Client";
import { IUser, PermissionVoice } from "../../types";
import { Delay } from "../../Utils/Function";

export const PermissionJoin = async (client: Client, newState: VoiceState, channel: PermissionVoice, user: IUser, TSP: number) => {
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

    await Delay(parseInt(Time.toFixed()))

    if (!client.Connection.voiceConnection.has(newState.id)) return

    const ActionChannel = await newState.guild.channels.fetch( channel.viewId )

    if (!ActionChannel?.isVoiceBased()) return

    ActionChannel.permissionOverwrites.edit(newState.member as GuildMember, { ViewChannel: channel.action == 'add' })
}