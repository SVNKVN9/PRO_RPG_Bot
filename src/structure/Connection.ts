import { Collection, Guild, VoiceState, PermissionFlagsBits } from "discord.js";
import { InviteJoin } from "../handlers/Connection/Invite";
import { PermissionJoin } from "../handlers/Connection/Permission";
import { SimpleJoin } from "../handlers/Connection/Simple";
import { LevelCal } from "../handlers/Level/LevelCal";
import { ILevel, IUser, SimpleVoice, InviteVoice, PermissionVoice, VoiceType, LogAction, BirthPoint } from "../types";
import Calculator from "../Utils/Calculator";
import Client from "./Client";
import { ObjectID } from "bson";

export default class {
    public voiceConnection: Collection<string, string> // UserId -> ChannelId
    public Uptime: Collection<string | undefined, { uptime: number, guild: Guild }>
    public travel: Collection<string, boolean>

    constructor(public client: Client) {
        this.voiceConnection = new Collection()
        this.Uptime = new Collection()
        this.travel = new Collection()
    }

    public async Join(newState: VoiceState) {
        const userId = newState.member?.id

        this.Uptime.set(userId, { uptime: Date.now(), guild: newState.guild })

        const user = await this.client.Database.Users.findOne({ UserId: userId }) as any as IUser

        await this.client.Database.Uptime.insertOne({
            Action: LogAction.Join,
            UserId: userId,
            ChannelId: newState.channel?.id,
            GuildId: newState.guild.id,
            Time: user.stats.time,
            EXP: user.stats.exp,
            Timestramp: Date.now(),
            Expire: Date.now() + (1000 * 60 * 60 * 24 * 3)
        })

        this.client.Database.RoleVoice.findOne({ channelInvite: newState.channelId }).then(async channel => {
            if (!channel) return

            try {
                const Guild = await this.client.Database.Guilds(channel.guildId)

                const guild = this.client.guilds.cache.get(channel.guildId)

                if (Guild.KickWhenMove) guild?.members.cache.get(newState.id)?.kick()
            } catch {}
        })

        const channels = await this.client.Database.RoleVoice.find({ channelId: newState.channelId }).toArray() as any as SimpleVoice[] | InviteVoice[] | PermissionVoice[]

        if (channels.length == 0) return

        if (newState.member?.id == newState.guild.ownerId) return console.log(`Owner ไม่สามารถเดินทางได้ ${newState.guild.id}`)

        const me = newState.guild.members.me

        if (!me?.permissions.has(PermissionFlagsBits.KickMembers)) return console.log(`ไม่มีสิทธิ kickMember ${newState.guild.id}`)

        if (!me.permissions.has(PermissionFlagsBits.CreateInstantInvite)) return console.log(`ไม่มีสิทธิ CreateInvite ${newState.guild.id}`)

        // Kick other Guilds

        console.log(`Start Kick other Guilds ${newState.id} | ${newState.guild.id}`)

        await Promise.all(this.client.guilds.cache.toJSON().map(async (guild) => {
            try {
                const isMember = guild.members.cache.get(newState.id) || await guild.members.fetch(newState.id)

                if (guild.id == newState.guild?.id) return
                if (this.client.config.Servers.includes(guild.id)) return

                const Guild = await this.client.Database.Guilds(guild.id)

                if (!Guild.KickWhenMove) return

                await isMember?.kick()
            } catch (err) {
            }
        }))

        console.log(`Kick other Guilds ${newState.id} | ${newState.guild.id}`)

        // Check BirthPoint

        console.log(`BirthPoint Checking ${newState.id} | ${newState.guild.id}`)

        const BirthPoint = await this.client.Database.BirthPoint.findOne({ _id: new ObjectID(user.birthpoint) }) as any as BirthPoint

        if (!BirthPoint) {
            const BirthPoints = await this.client.Database.BirthPoint.find({ guildId: newState.guild.id }).toArray()

            if (BirthPoints.length) await this.client.Database.Users.updateOne({ UserId: newState.member?.id }, { $set: { birthpoint: BirthPoints[0]._id } })
            else {
                const birthpoint = await this.client.Database.BirthPoint.insertOne({
                    name: newState.guild.name,
                    guildId: newState.guild.id,
                    channelId: newState.guild.channels.cache.first()?.id,
                })

                await this.client.Database.Users.updateOne({ UserId: newState.member?.id }, { $set: { birthpoint: birthpoint.insertedId } })
            }
        }

        console.log(`BirthPoint Checked ${newState.id} | ${newState.guild.id}`)

        this.voiceConnection.set(newState.id, newState.channelId as string)

        if (this.travel.has(newState.id)) return

        const level = await this.client.Database.Level.findOne({ LevelNo: user.stats.level.toString() }) as any as ILevel

        const { MOS } = await Calculator(this.client, user, level)

        channels.forEach(async channel => {
            if (channel.VoiceType == VoiceType.Simple) return SimpleJoin(this.client, newState, channel, user, MOS)
            if (channel.VoiceType == VoiceType.Invite) return InviteJoin(this.client, newState, channel, user, MOS)
            if (channel.VoiceType == VoiceType.Permission) return PermissionJoin(this.client, newState, channel, user, MOS)
        })
    }

    public async Leave(oldState: VoiceState) {
        try {
            await LevelCal(this.client, oldState.guild, oldState.id)
        } catch (err) {
            this.client.log.try_catch_Handling('🔴', err)
        }

        const user = await this.client.Database.Users.findOne({ UserId: oldState.id }) as any as IUser

        await this.client.Database.Uptime.insertOne({
            Action: LogAction.Leave,
            UserId: oldState.id,
            ChannelId: oldState.channel?.id,
            GuildId: oldState.guild.id,
            Time: user.stats.time,
            EXP: user.stats.exp,
            Timestramp: Date.now(),
            Expire: Date.now() + (1000 * 60 * 60 * 24 * 3)
        })

        this.Uptime.delete(oldState.id)
        this.voiceConnection.delete(oldState.id)

        const channels = await this.client.Database.RoleVoice.find({ channelId: oldState.channelId }).toArray() as any[]

        channels.forEach(async (channel) => {
            if (channel.permanent == 'permanent') return

            if (channel.giveId) {
                const role = oldState.guild.roles.cache.get(channel.giveId)

                if (!role) return

                await oldState.member?.roles.remove(role)
            }

            if (channel.takeId) {
                const role = oldState.guild.roles.cache.get(channel.takeId)

                if (!role) return

                await oldState.member?.roles.add(role)
            }

            if (channel.viewId) {
                const ActionChannel = await oldState.guild.channels.fetch(channel.viewId)

                if (!ActionChannel?.isVoiceBased()) return

                ActionChannel.permissionOverwrites.delete(oldState.member?.id as string)
            }
        })
    }
}