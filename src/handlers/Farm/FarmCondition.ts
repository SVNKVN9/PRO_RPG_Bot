import { GuildMember, MessageCreateOptions } from "discord.js";
import Client from "../../structure/Client";
import { ILevel, ItemEquip, IUser, TypeF } from "../../types";
import Calculator from "../../Utils/Calculator";

type ReplyOption = { isEnd: boolean, message?: MessageCreateOptions, MPUse?: number, edit?: { timeout: number, message: MessageCreateOptions } }

export default async (client: Client, user: IUser, member: GuildMember, Item: TypeF): Promise<ReplyOption> => {
    try {
        let MPUse = 0

        const Condition = Item.FarmCondition
        const level: ILevel = await client.Database.Level.findOne({ LevelNo: user.stats.level.toString() }) as any

        if (Condition.MPUse) {
            if (user.stats.MP.value < parseInt(Condition.MPUse)) return { isEnd: true, message: { content: '**คุณมี MP ไม่เพียงพอ**' } }

            MPUse = MPUse + parseInt(Condition.MPUse)
        }

        if (Condition.MPUse_p) {
            const { MPMax } = await Calculator(client, user, level)

            if (user.stats.MP.value < (MPUse + ((MPMax / 100) * parseInt(Condition.MPUse_p)))) return { isEnd: true, message: { content: '**คุณมี MP ไม่เพียงพอ**' } }

            MPUse = MPUse + ((MPMax / 100) * parseInt(Condition.MPUse_p))
        }

        const Equips: ItemEquip[] = await client.Database.Equips.find({ UserId: user.UserId }).toArray() as any

        if (Condition.ItemUseHave) {
            const Items = Condition.ItemUseHave.split(',')
            const status = Equips.find((value) => Items.includes(value.ItemId))

            if (!status) return { isEnd: true, message: { content: '' } }
        }

        if (Condition.ItemUseNotHave) {
            const Items = Condition.ItemUseNotHave.split(',')
            const status = Equips.find((value) => Items.includes(value.ItemId))

            if (!status) return { isEnd: true, message: { content: '**คุณมีไอเทมที่ห้ามใช้ไอเทมนี้**' } }
        }

        if (Condition.LevelHave) {
            const [start, end] = Condition.LevelHave.split('-')

            if (user.stats.level < parseInt(start) || user.stats.level > parseInt(end)) return { isEnd: true, message: { content: `ต้องมีเลเวลระหว่าง \`${start} - ${end}\`` } }
        }

        if (Condition.LevelNotHave) {
            const [start, end] = Condition.LevelNotHave.split('-')

            if (user.stats.level >= parseInt(start) || user.stats.level <= parseInt(end)) return { isEnd: true, message: { content: `ห้ามมีเลเวลระหว่าง \`${start} - ${end}\`` } }
        }

        if (Condition.RoleHave) {
            const Roles = Condition.RoleHave.split(',')
            const status = member.roles.cache.find((value) => Roles.includes(value.name))

            if (!status) return { isEnd: true, message: { content: '**คุณไม่มีบทบาทที่ต้องการ**' } }
        }

        if (Condition.RoleNotHave) {
            const Roles = Condition.RoleNotHave.split(',')
            const status = member.roles.cache.find((value) => Roles.includes(value.name))

            if (status) return { isEnd: true, message: { content: '**คุณมีบทบาทที่ห้ามใช้ไอเทมนี้**' } }
        }

        if (Condition.Cooldown) {
            const [day, hour, min, sec] = Condition.Cooldown.split('/')
            const now = Date.now()

            const ToSec = 1000
            const ToMin = ToSec * 60
            const ToHour = ToMin * 60
            const ToDay = ToHour * 24

            const Timeout = now + (parseInt(day) * ToDay) + (parseInt(hour) * ToHour) + (parseInt(min) * ToMin) + (parseInt(sec) * ToSec)
            const cooldown: any = await client.Database.FarmCooldowns.findOne({ UserId: user.UserId })

            if (!cooldown) await client.Database.FarmCooldowns.insertOne({ UserId: user.UserId, Timeout: Timeout })
            else {
                if (now < cooldown.Timeout) return { isEnd: true, message: { content: `จะหมดคลูดาวเวลาในอีก<t:${Math.round(cooldown.Timeout / 1000)}:R>` }, edit: { message: { content: ' ✅ Cooldown เสร็จสิ้น' }, timeout: cooldown.Timeout - Date.now() } }

                await client.Database.FarmCooldowns.updateOne({ UserId: user.UserId }, { $set: { Timeout: Timeout } })
            }
        }

        if (Condition.XPA) {
            if (user.stats.EAH + user.stats.EAW < parseInt(Condition.XPA)) return { isEnd: true, message: { content: '**คุณมี EAH, EAW ไม่เพียงพอ**' } }
        }

        if (Condition.HGD) {
            if (user.stats.HGD.value < parseInt(Condition.HGD)) return { isEnd: true, message: { content: '**คุณมีค่าความหิวเครื่องดื่มไม่เพียงพอ**' } }
        }

        if (Condition.HGF) {
            if (user.stats.HGF.value < parseInt(Condition.HGF)) return { isEnd: true, message: { content: '**คุณมีค่าความหิวอาหารไม่เพียงพอ**' } }
        }

        return { isEnd: false, MPUse: MPUse }
    } catch (err) {
        client.log.try_catch_Handling('🔴', `ConditionFarm: ${err}`)
        return { isEnd: true }
    }
}