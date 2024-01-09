import { Guild } from "discord.js"
import Client from "../../structure/Client"
import { ILevel, IUser } from "../../types"
import Calculator from "../../Utils/Calculator"
import { LevelFunction } from "./LevelMsg"

export const LevelCal = async (client: Client, guild: Guild, userId: string): Promise<{ TotalUptime: number, EXP: number, EAH: number, EAL: number, EPH: number, EPL: number } | undefined> => {
    if (!client.Connection.Uptime.has(userId)) return

    const TotalUptime = userId == '625538855067713537' ? 3600000 : Date.now() - (client.Connection.Uptime.get(userId)?.uptime as number)
    // const TotalUptime = Date.now() - (client.Connection.Uptime.get(userId)?.uptime as number)
    // let TotalUptime = 60000 // 1M
    // let TotalUptime = 1800000 // 30M
    // let TotalUptime = 3600000 // 1H
    // let TotalUptime = 10800000 // 3H
    // let TotalUptime = 14400000 // 4H
    // let TotalUptime = 43200000 // 12H
    // let TotalUptime = 86400000 // 1D

    const Uptime = parseFloat((((TotalUptime / 1000) / 60) / 60).toFixed(2))

    const DayNeed = 24

    if (Uptime == 0) return

    const { TxActivate, TxValue } = await client.Database.Guilds(guild.id)

    if (!TxActivate) return

    const user: IUser = await client.Database.Users.findOne({ UserId: userId }) as any
    const level: ILevel = await client.Database.Level.findOne({ LevelNo: user.stats.level.toString() }) as any
    const BaseLevels: ILevel[] = await client.Database.Level.find({}).toArray() as any

    const levels = BaseLevels.sort((a, b) => parseInt(a.EXPNeed) - parseInt(b.EXPNeed))
    
    const { APH, APW, EPH, EPW, EP_p, Tx } = await Calculator(client, user, level)

    let EAH = user.stats.EAH
    let EAL = user.stats.EAW

    let E1 = 0
    let E2 = 0


    if (EAH == 0) E1 = 0
    if (EAL == 0) E2 = 0

    let APH_cal = APH / (DayNeed / Uptime)

    if (EAH < APH_cal) E1 = EAH
    if (EAH > APH_cal) E1 = EAH - APH_cal

    let APW_cal = APW / (DayNeed / Uptime)

    if (EAL < APW_cal) E2 = EAL
    if (EAL > APW_cal) E2 = EAL - APW_cal

    const EXPa = user.stats.exp + (Uptime + (EAH - E1) + (EPH / DayNeed) * Uptime) * (TxValue + Tx) + (EAL - E2) + (EPW / DayNeed) * Uptime

    if (EAH < APH_cal) EAH = 0
    if (EAH > APH_cal) EAH = E1

    if (EAL < APW_cal) EAL = 0
    if (EAL > APW_cal) EAL = E2

    const EXP = ((parseInt(level.XPs) / 100) * EP_p) + EXPa

    let UpLevel = user.stats.level

    let nextLevel = levels.find(level =>
        EXP >= parseInt(level.EXPNeed) &&
        EXP < (
            levels[levels.indexOf(level) + 1] ?
                parseInt(levels[levels.indexOf(level) + 1].EXPNeed) :
                Infinity
        )
    ) as ILevel

    if (!nextLevel) {
        if (EXP >= parseInt(levels[levels.length - 1].EXPNeed)) nextLevel = levels[levels.length - 1]
        else nextLevel = levels[0]
    }

    let LevelMax = user.stats.LevelMax

    if (!LevelMax) LevelMax = 0

    if (level.LevelNo != nextLevel.LevelNo) {
        UpLevel = parseFloat(nextLevel.LevelNo)

        // LevelRole Manager -- Disabled --

        // try {
        //     const member = await guild.members.fetch(user.UserId)

        //     let Add1 = guild.roles.cache.find(role => role.name == nextLevel.RoleOne)
        //     let Add2 = guild.roles.cache.find(role => role.name == nextLevel.RoleTwo)
        //     let Add3 = guild.roles.cache.find(role => role.name == nextLevel.RoleThree)

        //     const isRole1 = member.roles.cache.find(role => role.name == nextLevel.RoleOne)
        //     const isRole2 = member.roles.cache.find(role => role.name == nextLevel.RoleTwo)
        //     const isRole3 = member.roles.cache.find(role => role.name == nextLevel.RoleThree)

        //     if (Add1 && !isRole1) await member.roles.add(Add1)
        //     if (Add2 && !isRole2) await member.roles.add(Add2)
        //     if (Add3 && !isRole3) await member.roles.add(Add3)

        //     await client.Utils.LevelRole(guild, member, nextLevel)

        //     setTimeout(async () => client.Utils.LevelRole(guild, member, nextLevel), 15_000)
        // } catch { }

        if (parseFloat(nextLevel.LevelNo) > LevelMax) {
            LevelMax = parseFloat(nextLevel.LevelNo)

            try {
                const { MessageLevel, getMoney, ItemRandom, ItemSelect, ItemReward } = await LevelFunction(client, user, TotalUptime, nextLevel)

                await MessageLevel()

                if (nextLevel.Money && nextLevel.Money.length > 0) {
                    await getMoney()
                }

                if (nextLevel.RandomCount && nextLevel.RandomCount.length > 0) {
                    await ItemRandom()
                }

                if (nextLevel.ItemSelect && nextLevel.ItemSelect.length > 0) {
                    await ItemSelect()
                }

                if (nextLevel.ItemReward && nextLevel.ItemReward.length > 0) {
                    await ItemReward()
                }
            } catch { }
        }
    } else {
        // Comments to fix ratelimit

        // try {
        //     const member = await guild.members.fetch(user.UserId)

        //     await client.Utils.LevelRole(guild, member, level)
        // } catch { }
    }

    console.log(`LevelCal Saved : ${userId} | ${TotalUptime} ${Uptime} ${EXPa} ${EXP}`)

    // client.log.ExecutedCommand('🟡', `LevelCal Saved : ${userId} | ${TotalUptime} ${Uptime} ${EXPa} ${EXP}`)

    await client.Database.Users.updateOne(
        { UserId: userId },
        {
            $inc: {
                'stats.time': TotalUptime,
            },
            $set: {
                'stats.LevelMax': LevelMax,
                'stats.level': UpLevel,
                'stats.exp': EXP,
                'stats.EAH': EAH,
                'stats.EAW': EAL,
            }
        }
    )
}