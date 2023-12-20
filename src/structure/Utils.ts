import { Guild, GuildMember, userMention } from "discord.js";
import { RoleList } from "../handlers/Level/RoleList";
import { ILevel, IUser, BirthPoint } from '../types'
import Calculator from "../Utils/Calculator";
import { HProleList } from "../Utils/roleList";
import Client from "./Client";
import { ObjectID } from "bson";

export default class Utils {
    constructor(public client: Client) {}

    async UpdateHG(UserId: string) {
        const User: IUser = await this.client.Database.Users.findOne({ UserId: UserId }) as any

        const now = Date.now()
        const totel = parseInt((((now - User.stats.HGF.UpdateLast) / 1000) / 60).toFixed(0))

        let HGF = User.stats.HGF.value - totel
        let HGD = User.stats.HGD.value - totel

        if (HGF <= 0) HGF = 0
        if (HGD <= 0) HGD = 0

        let HEA = User.stats.HEA ? User.stats.HEA.value : 100

        const msTo30Min = 1000 * 60 * 30
        if (now - (User.stats.HEA || { UpdateLast: 0 }).UpdateLast > msTo30Min) {
            const TotalPercentage = parseInt((( now - (User.stats.HEA || { UpdateLast: 0 }).UpdateLast ) / msTo30Min).toFixed(0))

            if (HGF > 0) HEA += TotalPercentage
            else HEA -= TotalPercentage
        }

        if (HEA <= 0) HEA = 0
        else if (HEA >= 100) HEA = 100

        await this.client.Database.Users.updateOne({
            UserId: UserId
        }, {
            $set: {
                'stats.HGF.value': HGF,
                'stats.HGD.value': HGD,
                'stats.HGF.UpdateLast': now,
                'stats.HGD.UpdateLast': now,
                // 'stats.HEA.value': HEA,
                // 'stats.HEA.UpdateLast': now
            }
        })

        return { HGF, HGD }
    }

    async UpdateHP_MP(guild: Guild | null, user: IUser, HPMax: number, MPMax: number, HPR: number, MPR: number, HP_p: number, MP_p: number): Promise<{ HP: number, HP_p: number, MP: number, MP_p: number }> {
        const now = Date.now()
        const totel = parseInt((((now - user.stats.HP.UpdateLast) / 1000) / 60).toFixed(0))

        if (totel < 1) return { HP: user.stats.HP.value, HP_p, MP: user.stats.MP.value, MP_p }

        let HP = (HPMax / 100) * (HPR / 1440) * totel
        let MP = (MPMax / 100) * (MPR / 1440) * totel

        if ((user.stats.HP.value + HP) > HPMax) HP = HPMax
        else HP = user.stats.HP.value + HP

        if ((user.stats.MP.value + MP) > MPMax) MP = MPMax
        else MP = user.stats.MP.value + MP

        const RoleChecker = async (member: GuildMember, RoleName: string) => {
            const isRole = member.roles.cache.find(role => role.name === RoleName)

            if (isRole) return

            for (let roleName of HProleList) {
                try {
                    const role = member.roles.cache.find(role => role.name === roleName)

                    if (role) await member.roles.remove(role)
                } catch (err) {

                }
            }

            try {
                const role = member.guild.roles.cache.find(role => role.name === RoleName)

                if (role) await member.roles.add(role)
            } catch (err) {

            }
        }

        let RoleName = ''

        if (HP_p >= 99) RoleName = '🩸100%🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩'
        else if (HP_p >= 94) RoleName = '🩸95%🟩🟩🟩🟩🟩🟩🟩🟩🟩'
        else if (HP_p >= 89) RoleName = '🩸90%🟩🟩🟩🟩🟩🟩🟩🟩🟩'
        else if (HP_p >= 79) RoleName = '🩸80%🟩🟩🟩🟩🟩🟩🟩🟩'
        else if (HP_p >= 69) RoleName = '🩸70%🟨🟨🟨🟨🟨🟨🟨'
        else if (HP_p >= 59) RoleName = '🩸60%🟨🟨🟨🟨🟨🟨'
        else if (HP_p >= 49) RoleName = '🩸50%🟨🟨🟨🟨🟨'
        else if (HP_p >= 39) RoleName = '🩸40%🟧🟧🟧🟧'
        else if (HP_p >= 29) RoleName = '🩸30%🟧🟧🟧'
        else if (HP_p >= 19) RoleName = '🩸20%🟥🟥'
        else if (HP_p >= 9) RoleName = '🩸10%🟥'
        else if (HP_p >= 6) RoleName = '🩸6%'
        else if (HP_p >= 3) RoleName = '🩸3%'
        else RoleName = ''

        try {
            if (guild) {
                const member = await guild.members.fetch(user.UserId)

                await RoleChecker(member, RoleName)
            }
        } catch (err) {  }

        await this.client.Database.Users.updateOne({
            UserId: user.UserId
        }, {
            $set: {
                'stats.HP.value': HP,
                'stats.MP.value': MP,
                'stats.HP.UpdateLast': now,
                'stats.MP.UpdateLast': now
            }
        })

        return { HP, HP_p: (HP / HPMax) * 100, MP, MP_p: (MP / MPMax) * 100 }
    }

    async CheckHPisZero(guild: Guild, UserId: string) {
        const user = await this.client.Database.Users.findOne({ UserId: UserId }) as any as IUser
        const level = await this.client.Database.Level.findOne({ LevelNo: user.stats.level.toString() }) as any as ILevel

        const { HPMax, MPMax, HPR, MPR, HP_p, MP_p } = await Calculator(this.client, user, level)
        const { HP } = await this.UpdateHP_MP(guild, user, HPMax, MPMax, HPR, MPR, HP_p, MP_p)

        if (HP <= 0) {
            try {
                await this.client.Database.Users.updateOne({ UserId: UserId }, { $set: { 'stats.HP.value': 0 } })

                const user = await this.client.users.fetch(UserId)

                user.send({ content: `💀💀<@${user.id}> เสียชีวิต💀💀` })
            } catch { }

            const BirthPoint = await this.client.Database.BirthPoint.findOne({ _id: new ObjectID(user.birthpoint) }) as any as BirthPoint

            if (!BirthPoint) return

            try {
                const SpanwGuild = this.client.guilds.cache.get(BirthPoint.guildId) || await this.client.guilds.fetch(BirthPoint.guildId)

                let invite = (await SpanwGuild.invites.fetch({ channelId: BirthPoint.channelId })).find((invite) => invite.inviter?.id == this.client.user?.id)

                if (!invite) invite = await SpanwGuild.invites.create(BirthPoint.channelId)

                const user = await this.client.users.fetch(UserId)

                await user.send({ content: invite.url })

                await this.client.Database.Users.updateOne({ UserId }, { $set: { alive: false } })

                const Guild = await this.client.Database.Guilds.findOne({ id: SpanwGuild.id })

                if (!Guild.KickWhenDie) return

                if (!this.client.config.Servers.includes(guild.id)) await guild.members.kick(user)
            } catch { }
        }
    }

    async LevelRole(guild: Guild, member: GuildMember, Level: ILevel) {
        for (let roleName of RoleList) {
            let isRole = member.roles.cache.find(role => role.name == roleName)

            if (!isRole) continue

            if (isRole.name == Level.RoleOne) continue

            if (isRole.name == Level.RoleTwo) continue

            if (isRole.name == Level.RoleThree) continue

            await member.roles.remove(isRole)
        }

        if (Level.RoleOne) {
            let role = guild.roles.cache.find(role => role.name == Level.RoleOne)

            if (role) await member.roles.add(role)
        }

        if (Level.RoleTwo) {
            let role = guild.roles.cache.find(role => role.name == Level.RoleTwo)

            if (role) await member.roles.add(role)
        }

        if (Level.RoleThree) {
            let role = guild.roles.cache.find(role => role.name == Level.RoleThree)

            if (role) await member.roles.add(role)
        }
    }
}