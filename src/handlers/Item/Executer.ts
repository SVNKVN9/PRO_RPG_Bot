import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, CommandInteraction, EmbedBuilder, Guild, GuildMember, Message, MessageCreateOptions, MessageEditOptions, Role, VoiceState } from "discord.js";
import {
    Activate,
    AttackActivate,
    ConditionItem, ConditionNotRequire, ConditionRequire, ConditionTarget,
    EquipPos,
    IBase, ILevel, ItemBase, ItemEquip, ItemsType, IUser, Notify, Passive, StatusType, TypeAB, TypeB, TypeF, TypeP, TypePA, TypePD, UseCondition
} from "../../types";
import Calculator from "../../Utils/Calculator";
import { msToDHMS } from "../../Utils/Function";
import Client from "../../structure/Client";

export default class {
    private PeriodUsed: Collection<string, Collection<string, number>> // UserId -> ItemId -> Timeout (Timestamp)

    constructor(public client: Client) {
        this.PeriodUsed = new Collection()
    }

    async CooldownChecker(MemberId: string, ItemId: string): Promise<StatusType> {
        const now = Date.now()

        const cooldown: any = await this.client.Database.Cooldowns.findOne({ UserId: MemberId, ItemId: ItemId })

        if (!cooldown) return { isEnd: false }
        if (now < cooldown.TimeOut) return { isEnd: true, message: { content: `จะหมดคลูดาวเวลา: \`${new Date(cooldown.TimeOut).toString().split(" ", 5).join(" ")}\`, หรืออีก \`${msToDHMS(cooldown.TimeOut - Date.now())}\`` } }

        return { isEnd: false }
    }

    async setCooldown(Cooldown: string, MemberId: string, ItemId: string) {
        const [day, hour, min, sec] = Cooldown.split('/')

        const ToSec = 1000
        const ToMin = ToSec * 60
        const ToHour = ToMin * 60
        const ToDay = ToHour * 24

        const cooldownTimeout = Date.now() + (parseInt(day) * ToDay) + (parseInt(hour) * ToHour) + (parseInt(min) * ToMin) + (parseInt(sec) * ToSec)

        const cooldown: any = await this.client.Database.Cooldowns.findOne({ UserId: MemberId, ItemId: ItemId })

        if (!cooldown) await this.client.Database.Cooldowns.insertOne({ UserId: MemberId, ItemId: ItemId, TimeOut: cooldownTimeout })
        else await this.client.Database.Cooldowns.updateOne({ UserId: MemberId, ItemId: ItemId }, { $set: { TimeOut: cooldownTimeout } })
    }

    async BaseConditionChecker(Condition: ConditionRequire | ConditionNotRequire, member: GuildMember): Promise<StatusType> {
        const Equips: ItemEquip[] = await this.client.Database.Equips.find({ UserId: member.id }).toArray() as any

        const ServerAreThere = this.client.guilds.cache.toJSON().filter(async (Guild) => await Guild.members.fetch(member.id)).map((Guild) => Guild.id)
        const ConditionOption = Condition.UseCondition == UseCondition.FullOption ? true : false

        if (Condition.ServerIds?.length) {
            if (!Condition.ServerIds.some(id => ServerAreThere.includes(id))) return { isEnd: true, message: { content: 'Error ServerIds' } }
        }

        if (Condition.UserIds?.length) {
            if (!Condition.UserIds.includes(member.id)) return { isEnd: true, message: { content: 'ErrorUserIds' } }
        }

        if (Condition.Wearables?.length) {
            const ItemIds = Condition.Wearables
            const status = Equips.find((value) => ItemIds.includes(value.ItemId))

            if (!status) return { isEnd: true, message: { content: '**คุณไม่มีไอเทมสำหรับใช้ไอเทมนี้**' } }
        }

        if (Condition.RoleIds?.length) {
            const Roles = Condition.RoleIds
            const status = member.roles.cache.find(role => Roles.includes(role.id))

            if (!status) return { isEnd: true, message: { content: '**คุณไม่มีบทบาทที่ต้องการ**' } }
        }

        if (Condition.RoleNames?.length) {
            const Roles = Condition.RoleNames
            const status = member.roles.cache.find(role => Roles.includes(role.name))

            if (status) return { isEnd: true, message: { content: '**คุณมีบทบาทที่ห้ามใช้ไอเทมนี้**' } }
        }

        return { isEnd: false }
    }

    FindEquipPos(Item: ItemsType) {
        const PassiveMe = (Item as TypeAB | TypeB).PassiveMe

        if ((PassiveMe || {}).EquipPos) return PassiveMe.EquipPos

        const PassiveTarget = (Item as TypePA | TypeP | TypePD).PassiveTarget

        if ((PassiveTarget || {}).EquipPos) return PassiveTarget.EquipPos

        return undefined
    }

    async EquipLimitChecker(interaction: CommandInteraction, UserId: string, Item: ItemsType): Promise<StatusType> {
        const List: { type: EquipPos, limit: number, alert?: boolean }[] = [
            { type: EquipPos.CultivationTechnique, limit: 1, alert: true },
            { type: EquipPos.CultivationEnhancement, limit: 1, alert: true },
            { type: EquipPos.AbnormalEffect, limit: 25 },
            { type: EquipPos.SpecialEffect, limit: 25 },
            { type: EquipPos.Wound, limit: 25 },

            { type: EquipPos.GeneralTips, limit: 9, alert: true },
            { type: EquipPos.Wing, limit: 1, alert: true },
            { type: EquipPos.MainWeapon, limit: 1, alert: true },
            { type: EquipPos.SecretWeapon, limit: 3, alert: true },
            { type: EquipPos.ItemUse, limit: 9, alert: true },
            { type: EquipPos.ItemTransFrom, limit: 3, alert: true },

            { type: EquipPos.SecretTechnique, limit: 9, alert: true },
            { type: EquipPos.ItemDecoration, limit: 9, alert: true },
            { type: EquipPos.Emblem, limit: 8, alert: true },
            { type: EquipPos.ItemSecret, limit: 9, alert: true },
            { type: EquipPos.Race, limit: 1, alert: true },
            { type: EquipPos.Race, limit: 5, alert: true },
            { type: EquipPos.PersonalElement, limit: 6, alert: true },
            { type: EquipPos.SuperPower, limit: 5, alert: true }
        ]

        const Items = await this.client.Database.Equips.aggregate([
            { $match: { UserId } },
            { $group: { _id: "$ItemId", count: { $sum: 1 } } },
            { $lookup: { from: "items", localField: "_id", foreignField: "Base.ItemId", as: "Item" } },
        ]).toArray() as {
            _id: string,
            count: number,
            Item: ItemsType[]
        }[]

        const EquipType = this.FindEquipPos(Item)

        const Equips = Items.filter((data) => {
            const Item = this.FindEquipPos(data.Item[0])

            if (Item == EquipType) return true
        }).length

        const isList = List.find((data) => data.type.type == EquipType)

        if (isList && isList.limit <= Equips && isList.alert) {
            if (
                isList.type == EquipPos.CultivationTechnique ||
                isList.type == EquipPos.CultivationEnhancement
            ) {
                const Cultivation = await this.CultivationChecker(interaction, isList.type == EquipPos.CultivationTechnique ? 'CultivationTechnique' : 'CultivationEnhancement', UserId, Item)

                return Cultivation
            }

            return { isEnd: true, message: { content: `⚠️ช่องไอเทมเต็มตามที่กดหนดไว้แล้ว โปรดถอดไอเทม หรือรอให้เวลาสถานะไอเทมหมด ถึงจะสามารถใช้ใหม่ได้อีกครั้ง` } }
        }

        return { isEnd: false }
    }

    async ConditionOpenItem(user: IUser, member: GuildMember, item: ItemsType, ConditionItem: ConditionItem, interaction: CommandInteraction, Target?: GuildMember | undefined, AcceptCheck?: boolean): Promise<StatusType> {
        try {
            if (!Target) {
                const EquipLimit = await this.EquipLimitChecker(interaction, member.id, item)

                if (EquipLimit.isEnd) return EquipLimit
            }
            
            const Base: IBase = item.Base

            let { PeriodUseMessage, PreparationPeriodMessage, FinishMessage } = ConditionItem

            const level: ILevel = await this.client.Database.Level.findOne({ LevelNo: user.stats.level.toString() }) as any

            const { HPMax, HP_p, MPMax, MP_p } = await Calculator(this.client, user, level)

            // Parameter Use
            let HPUse = 0
            let MPUse = 0
            let EXPUse = 0
            let XPSUse = 0
            let EAHUse = 0
            let EAWUse = 0

            if (ConditionItem.HP) {
                if (user.stats.HP.value < parseInt(ConditionItem.HP)) return { isEnd: true, message: { content: '**คุณมี HP ไม่เพียงพอ**' } }

                HPUse += parseInt(ConditionItem.HP)
            }

            if (ConditionItem.HP_p) {
                if (user.stats.HP.value < (HPUse + ((HPMax / 100) * parseInt(ConditionItem.HP_p)))) return { isEnd: true, message: { content: '**คุณมี HP ไม่เพียงพอ**' } }

                HPUse += parseInt(ConditionItem.HP_p)
            }

            if (ConditionItem.MP) {
                if (user.stats.MP.value < parseInt(ConditionItem.MP)) return { isEnd: true, message: { content: '**คุณมี MP ไม่เพียงพอ**' } }

                MPUse += parseInt(ConditionItem.MP)
            }

            if (ConditionItem.MP_p) {
                if (user.stats.MP.value < (MPUse + ((MPMax / 100) * parseInt(ConditionItem.MP_p)))) return { isEnd: true, message: { content: '**คุณมี MP ไม่เพียงพอ**' } }

                MPUse = + ((MPMax / 100) * parseInt(ConditionItem.MP_p))
            }

            if (ConditionItem.EXP) {
                if (user.stats.exp < parseInt(ConditionItem.EXP)) return { isEnd: true, message: { content: '**คุณมี EXP ไม่เพียงพอ**' } }

                EXPUse += parseInt(ConditionItem.EXP)
            }

            if (ConditionItem.XPS) {
                if (parseFloat(level.XPs) < parseInt(ConditionItem.XPS)) return { isEnd: true, message: { content: '**คุณมี XPS ไม่เพียงพอ**' } }

                XPSUse += parseInt(ConditionItem.XPS)
            }

            if (ConditionItem.EAH) {
                if (user.stats.EAH < parseInt(ConditionItem.EAH)) return { isEnd: true, message: { content: '**คุณมี HP ไม่เพียงพอ**' } }

                EAHUse += parseInt(ConditionItem.EAH)
            }

            if (ConditionItem.EAW) {
                if (user.stats.EAW < parseInt(ConditionItem.EAW)) return { isEnd: true, message: { content: '**คุณมี EAW ไม่เพียงพอ**' } }

                EAWUse += parseInt(ConditionItem.EAW)
            }

            const { ConditionRequire, ConditionNotRequire } = ConditionItem

            // ConditionRequire
            if (ConditionRequire) {
                const Checked = await this.BaseConditionChecker(ConditionRequire, member)

                if (ConditionRequire.HP) {
                    if (user.stats.HP.value < parseInt(ConditionRequire.HP)) return { isEnd: true, message: { content: '**คุณมี HP ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.HP_p) {
                    if (HP_p < parseInt(ConditionRequire.HP_p)) return { isEnd: true, message: { content: '**คุณมี HP% ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.MP) {
                    if (user.stats.MP.value < parseInt(ConditionRequire.MP)) return { isEnd: true, message: { content: '**คุณมี MP ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.MP_p) {
                    if (MP_p < parseInt(ConditionRequire.MP_p)) return { isEnd: true, message: { content: '**คุณมี MP% ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.HGF) {
                    if (user.stats.HGF.value < parseInt(ConditionRequire.HGF)) return { isEnd: true, message: { content: '**คุณมี HGF ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.HGD) {
                    if (user.stats.HGD.value < parseInt(ConditionRequire.HGD)) return { isEnd: true, message: { content: '**คุณมี HGD  ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.Level) {
                    const [start, end] = ConditionRequire.Level.split('-') as [string, string]

                    if (user.stats.level < parseInt(start) || user.stats.level > parseInt(end)) return { isEnd: true, message: { content: `ต้องมีเลเวลระหว่าง \`${start} - ${end}\`` } }
                }

                if (Checked.isEnd) return Checked
            }
            if (ConditionNotRequire) {
                const Checked = await this.BaseConditionChecker(ConditionNotRequire, member)

                if (ConditionNotRequire.Level) {
                    const [start, end] = ConditionNotRequire.Level.split('-') as [string, string]

                    if (user.stats.level > parseInt(start) || user.stats.level < parseInt(end)) return { isEnd: true, message: { content: `ห้ามมีเลเวลระหว่าง \`${start} - ${end}\`` } }
                }

                if (Checked.isEnd) return Checked
            }

            if (ConditionItem.Cooldown) {
                if (!Target) {
                    const Status = await this.CooldownChecker(user.UserId, Base.ItemId)

                    if (Status.isEnd == true) return Status
                } else {
                    const Status = await this.CooldownChecker(Target.user.id, Base.ItemId)

                    if (Status.isEnd == true) return Status
                }
            }

            const CreateMessageFormat = (str?: string, cooldown?: number): string => {
                if (!str) return ''
                let verb
                if (ConditionItem.TypeUse) {
                    const { MeMessage, AcceptMessage, NotAcceptMessage, FarmMessage } = ConditionItem.TypeUse

                    verb = (!Target ?
                        (item.Type == 'F' ? FarmMessage : MeMessage) :
                        (AcceptCheck ? AcceptMessage : NotAcceptMessage));
                }

                str = str.split('{member}').join(`<@${member.id}>`)
                str = str.split('{target}').join(`<@${Target?.id}>`)
                str = str.split('{item}').join(`${item.Base.ItemId} ${item.Base.EmojiId ?? ''} ${item.Base.ItemName}`)
                str = str.split('{item.id}').join(`${item.Base.ItemId}`)
                str = str.split('{item.name}').join(`${item.Base.ItemName}`)
                str = str.split('{item.emogi}').join(`${item.Base.EmojiId}`)

                if (cooldown) str = str.split('{cooldown}').join(`<t:${Math.round((Date.now() / 1000) + (cooldown / 1000))}:R>`)
                else str = str.split('{cooldown}').join(``)

                if (verb) str = str.split('{verb}').join(`${verb}`)

                return str
            }

            if (ConditionItem.PeriodUse) {
                if (!this.PeriodUsed.has(user.UserId)) this.PeriodUsed.set(user.UserId, new Collection())

                const cooldownItems = this.PeriodUsed.get(user.UserId)

                if (cooldownItems?.has(Base.ItemId)) {
                    const expirationTime = cooldownItems.get(Base.ItemId) as number

                    if (Date.now() < expirationTime) return { isEnd: true, message: { content: 'คุณกำลังใช้ไอเทมนี้อยู่' } }
                }

                const [day, hour, min, sec] = ConditionItem.PeriodUse.split('/')

                const ToSec = 1000
                const ToMin = ToSec * 60
                const ToHour = ToMin * 60
                const ToDay = ToHour * 24

                const cooldownTimeout = (parseInt(day) * ToDay) + (parseInt(hour) * ToHour) + (parseInt(min) * ToMin) + (parseInt(sec) * ToSec)

                cooldownItems?.set(Base.ItemId, Date.now() + cooldownTimeout)

                try {
                    if (!PeriodUseMessage) PeriodUseMessage = {}

                    const content = CreateMessageFormat(
                        (!Target ?
                            (item.Type == 'F' ?
                                PeriodUseMessage?.Farm ?? '{member} กำลังปลูก {item} จะเสร็จในอีก {cooldown}' :
                                PeriodUseMessage?.Me ?? '{member} กำลังใช้ {item} จะเสร็จในอีก {cooldown}') :
                            (AcceptCheck ?
                                PeriodUseMessage?.Accept ?? '{member} กำลังป้อน {item} ให้กับ {target} จะเสร็จในอีก {cooldown}' :
                                PeriodUseMessage?.NotAccept ?? '{member} กำลังใช้ {item} โจมตี {target} จะเสร็จในอีก {cooldown}')),
                        cooldownTimeout
                    )

                    if (PeriodUseMessage?.EveryOneCanSee) interaction.channel?.send({ content: '', embeds: [{ description: content }] })
                        .then((msg) => setTimeout(() => msg.delete(), cooldownTimeout))
                    else await interaction.editReply({ content: '', embeds: [{ description: content }] })
                } catch (err) {
                    this.client.log.try_catch_Handling('🔴', `Notify ${err}`)
                }

                let isPass: StatusType = { isEnd: false }

                const inVoiceChecker = async (oldState: VoiceState, newState: VoiceState): Promise<any> => {
                    if (newState.member?.id != member.id) return
                    if (newState.channelId == oldState.channelId) return

                    isPass = { isEnd: true }

                    interaction.editReply({ content: `❌เปิดใช้หรือร่ายสกิล (${Base.ItemId}) ไม่สำเร็จ เนื่องจากออกจากห้องกลางคัน` })

                    cooldownItems?.delete(Base.ItemId)

                    this.client.Database.Inventorys.updateOne({ UserId: user.UserId, ItemId: Base.ItemId }, { $set: { Locked: false } })
                }

                this.client.on('voiceStateUpdate', inVoiceChecker)

                await new Promise(resolve => setTimeout(() => {
                    this.client.removeListener('voiceStateUpdate', inVoiceChecker)

                    cooldownItems?.delete(Base.ItemId)
                    resolve('')
                }, cooldownTimeout))

                if (isPass.isEnd) return isPass
            }

            if (ConditionItem.PreparationPeriod) {
                const [day, hour, min, sec] = ConditionItem.PreparationPeriod.split('/')

                const ToSec = 1000
                const ToMin = ToSec * 60
                const ToHour = ToMin * 60
                const ToDay = ToHour * 24

                const cooldownTimeout = (parseInt(day) * ToDay) + (parseInt(hour) * ToHour) + (parseInt(min) * ToMin) + (parseInt(sec) * ToSec)

                try {
                    if (!PreparationPeriodMessage) PreparationPeriodMessage = {}

                    const content = CreateMessageFormat(
                        (!Target ?
                            (item.Type == 'F' ?
                                PreparationPeriodMessage.Farm ?? 'กำลังจะเกิดเป็นต้นในอีก {cooldown}' :
                                PreparationPeriodMessage.Me ?? '{item} กำลังจะส่งผลให้กับ {member} ในอีก {cooldown}') :
                            (AcceptCheck ?
                                PreparationPeriodMessage.Accept ?? '{item} กำลังจะส่งผลให้กับ {target} ในอีก {cooldown}' :
                                PreparationPeriodMessage.NotAccept ?? '{item} กำลังเคลื่อนที่เข้าหา {target} ในอีก {cooldown}')),
                        cooldownTimeout
                    )

                    if (PreparationPeriodMessage?.EveryOneCanSee) interaction.channel?.send({ content: '', embeds: [{ description: content }] })
                        .then((msg) => setTimeout(() => msg.delete(), cooldownTimeout))
                    else await interaction.editReply({ content: '', embeds: [{ description: content }] })
                } catch (err) {
                    this.client.log.try_catch_Handling('🔴', `Notify ${err}`)
                }

                await new Promise(res => setTimeout(res, cooldownTimeout))
            }

            if (ConditionItem.Cooldown) {
                if (!Target || !AcceptCheck) {
                    await this.setCooldown(ConditionItem.Cooldown, user.UserId, Base.ItemId)
                } else {
                    await this.setCooldown(ConditionItem.Cooldown, Target.user.id, Base.ItemId)
                }
            }

            let EndMessage

            try {
                if (!FinishMessage) FinishMessage = {}

                EndMessage = CreateMessageFormat(!Target ?
                    (item.Type == 'F' ?
                        FinishMessage?.Farm ?? '{member} ปลูก {item} สำเร็จ' :
                        FinishMessage?.Me ?? '{member} ใช้ {item} สำเร็จ') :
                    (AcceptCheck ?
                        FinishMessage?.Accept ?? '{member} ป้อน {item} ให้กับ {target} สำเร็จ' :
                        FinishMessage?.NotAccept ?? '{member} ใช่ {item} โจมตี {target} สำเร็จ')
                )
            } catch (err) {
                this.client.log.try_catch_Handling('🔴', `Notify ${err}`)
            }

            return { isEnd: false, MPUse, HPUse, message: { content: '', embeds: [{ description: EndMessage }] } }
        } catch (err) {
            this.client.log.try_catch_Handling('🔴', `ConditionOpenItem ${err}`)
            return { isEnd: true }
        }
    }

    async ConditionTarget(user: IUser, GuildTarget: GuildMember, item: TypeAB | TypePA): Promise<StatusType> {
        try {
            const Condition = (item as TypePA).ConditionTarget || (item as TypeAB).Extend ? (item as TypeAB).Extend.ConditionTarget : undefined

            if (!Condition) return { isEnd: false }

            const level: ILevel = await this.client.Database.Level.findOne({ LevelNo: user.stats.level.toString() }) as any
            const { HPMax, HP_p, MPMax, MP_p } = await Calculator(this.client, user, level)

            const { ConditionRequire, ConditionNotRequire } = Condition

            // ConditionRequire
            if (ConditionRequire) {
                const Checked = await this.BaseConditionChecker(ConditionRequire, GuildTarget)

                if (ConditionRequire.HP) {
                    if (user.stats.HP.value < parseInt(ConditionRequire.HP)) return { isEnd: true, message: { content: '**คุณมี HP ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.HP_p) {
                    if (HP_p < parseInt(ConditionRequire.HP_p)) return { isEnd: true, message: { content: '**คุณมี HP% ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.MP) {
                    if (user.stats.MP.value < parseInt(ConditionRequire.MP)) return { isEnd: true, message: { content: '**คุณมี MP ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.MP_p) {
                    if (MP_p < parseInt(ConditionRequire.MP_p)) return { isEnd: true, message: { content: '**คุณมี MP% ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.HGF) {
                    if (user.stats.HGF.value < parseInt(ConditionRequire.HGF)) return { isEnd: true, message: { content: '**คุณมี HGF ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.HGD) {
                    if (user.stats.HGD.value < parseInt(ConditionRequire.HGD)) return { isEnd: true, message: { content: '**คุณมี HGD  ไม่เพียงพอ**' } }
                }

                if (ConditionRequire.Level) {
                    if (user.stats.level < parseInt(ConditionRequire.Level)) return { isEnd: true, message: { content: '**คุณมี Level ไม่เพียงพอ**' } }
                }

                if (Checked.isEnd) return Checked
            }
            if (ConditionNotRequire) {
                const Checked = await this.BaseConditionChecker(ConditionNotRequire, GuildTarget)

                if (ConditionNotRequire.Level) {
                    if (user.stats.level < parseInt(ConditionNotRequire.Level)) return { isEnd: true, message: { content: '**คุณมี Level ที่ห้ามมี**' } }
                }

                if (Checked.isEnd) return Checked
            }

            return { isEnd: false }
        } catch (err) {
            this.client.log.try_catch_Handling('🔴', `ConditionTarget ${err}`)
            return { isEnd: true }
        }
    }

    async Passive(interaction: CommandInteraction, UserId: string, ItemTarget: ItemBase, Passive: Passive, Quality: number, isSD?: boolean): Promise<StatusType> {
        try {
            if (!Passive.StatusAge) return { isEnd: false }

            const [day, hour, min, sec] = Passive.StatusAge.split('/')

            const ToSec = 1000
            const ToMin = ToSec * 60
            const ToHour = ToMin * 60
            const ToDay = ToHour * 24

            const Timeout = Date.now() + (parseInt(day) * ToDay) + (parseInt(hour) * ToHour) + (parseInt(min) * ToMin) + (parseInt(sec) * ToSec)

            const isItems: ItemEquip[] = await this.client.Database.Effect.find({ UserId }).toArray() as any

            const SD = isSD ? (Timeout / 100) * Quality : Quality

            const insertItem = async () => {
                // this.client.guilds.cache.forEach(async (guild) => {
                //     try {
                //         const member = guild.members.cache.get(UserId) || await guild.members.fetch(UserId)

                //         if (!member) return
                //     } catch { }
                // })

                await this.client.Database.Effect.insertOne({
                    UserId: UserId,
                    ItemCount: ItemTarget.ItemCount,
                    ItemDate: ItemTarget.ItemDate,
                    ItemId: ItemTarget.ItemId,
                    TimeOut: SD ? SD : Timeout,
                    Quality: Quality
                })
            }


            if (isItems.length > 0) {
                const ItemTargetPos = this.FindEquipPos(await this.client.Database.Items(ItemTarget.ItemId) as ItemsType)

                if (ItemTargetPos == EquipPos.CultivationTechnique.type || ItemTargetPos == EquipPos.CultivationEnhancement.type) {

                    await Promise.all(isItems.map(async (ItemBase) => {
                        const Item = await this.client.Database.Items(ItemBase.ItemId) as ItemsType
                        const EquipType = this.FindEquipPos(Item)

                        console.log('Checking', EquipType, ItemTargetPos)

                        if (EquipType != ItemTargetPos) return

                        console.log('Delete', EquipType, ItemTargetPos)

                        await this.client.Database.Effect.deleteOne({ UserId, ItemId: ItemBase.ItemId })
                    }))
                }

                if (Passive.EquipType == 'OverLap') {
                    await this.client.Database.Effect.deleteMany({ UserId, ItemId: ItemTarget.ItemId })

                    await insertItem()
                } else if (Passive.EquipType == 'Stack') {
                    await insertItem()
                } else {
                    if (isItems.find((Item) => Item.ItemId == ItemTarget.ItemId)) return { isEnd: true, message: { embeds: [], components: [], content: 'ไม่สามารถใส่ทับซ้อนกันได้' } }

                    await insertItem()
                }
            } else {
                await insertItem()
            }

            return { isEnd: false }
        } catch (err) {
            this.client.log.try_catch_Handling('🔴', `Passive ${err}`)
            return { isEnd: true }
        }
    }

    async CultivationChecker(interaction: CommandInteraction, type: 'CultivationTechnique' | 'CultivationEnhancement', UserId: string, Item: ItemsType): Promise<StatusType> {
        try {
            const ItemNameFormat = (Item: ItemsType) => `${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName}`

            const Embed = new EmbedBuilder()
                .setTitle(`❗ คุณมีไอเทม ${type == 'CultivationTechnique' ? ' 📚 ตำราเทคนิคการบ่มเพาะพลัง' : '💊 โอสถบ่มเพาะพลัง'} ที่กำลังเรียนรู้อยู่แล้ว ยืนยันว่า คุณต้องการใช้ทับแทนที่${type == 'CultivationTechnique' ? 'ตำราเล่มเก่า' : 'โอสถตัวเก่า'} หรือไม่`)
                .setDescription(`✨${type == 'CultivationTechnique' ? 'ตำราเล่มใหม่' : 'โอสถตัวใหม่'}\n${ItemNameFormat(Item)}\n\n🪦${type == 'CultivationTechnique' ? 'ตำราเล่มเก่า' : 'โอสถตัวเก่า'}ที่กำลังใช้อยู่ปัจุบัน\n${Item.Base.ItemName}`)
                .setFooter({ text: 'หมายเหตุ : การใช้ไอเทมทับ หมายถึงการนำไอเทมใหม่ ไปแทนที่ไอเทมเก่า และไอเทมเก่าที่โดนทับไป จะถูกลบออก' })

            const message = await interaction.editReply({
                embeds: [Embed],
                components: [
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('accept')
                                .setStyle(ButtonStyle.Success)
                                .setLabel('✅ยืนยัน✅'),

                            new ButtonBuilder()
                                .setCustomId('deline')
                                .setStyle(ButtonStyle.Danger)
                                .setLabel('❌ยกเลิก❌')
                        )
                ]
            })

            const awaitComponent = await message.awaitMessageComponent({ filter: (filter) => filter.user.id == UserId, time: 60_000 }).catch(() => { })

            if (!awaitComponent) return { isEnd: false }

            if (!awaitComponent.isButton()) return { isEnd: false }

            await awaitComponent.deferUpdate()

            if (awaitComponent.customId == 'deline') return { isEnd: true, message: { components: [], content: '', embeds: [{ description: '✅ยกเลิกการสวมใส่แทนทับ' }] } }

            await interaction.editReply({ components: [] })

            return { isEnd: false }
        } catch (err) {
            console.log(err)

            return { isEnd: true }
        }
    }

    async Activate(User: IUser, member: GuildMember, Activate: Activate) {
        try {
            // Default Activate
            const DefaultActivate = Activate.Default

            if (DefaultActivate) {
                const level: ILevel = await this.client.Database.Level.findOne({ LevelNo: User.stats.level.toString() }) as any
                let newData: any = {}

                const { HPMax, MPMax } = await Calculator(this.client, User, level)

                let TotelEXP = 0

                if (DefaultActivate.EAH) newData['stats.EAH'] = parseInt(DefaultActivate.EAH)
                if (DefaultActivate.HGD) newData['stats.HGD.value'] = parseInt(DefaultActivate.HGD) * 60
                if (DefaultActivate.EXP) TotelEXP = parseInt(DefaultActivate.EXP)
                if (DefaultActivate.EAW) newData['stats.EAW'] = parseInt(DefaultActivate.EAW)
                if (DefaultActivate.HGF) newData['stats.HGF.value'] = parseInt(DefaultActivate.HGF) * 60
                if (DefaultActivate.XPB) TotelEXP = TotelEXP + (parseInt(level.XPs) / 100) * parseInt(DefaultActivate.XPB)
                newData['stats.exp'] = TotelEXP

                let TotalHP = 0
                if (DefaultActivate.HP) TotalHP += parseInt(DefaultActivate.HP)
                if (DefaultActivate.HM_p) TotalHP += parseInt(DefaultActivate.HM_p) * HPMax
                if (DefaultActivate.HP_p) TotalHP += TotalHP + ((User.stats.HP.value / 100) * parseInt(DefaultActivate.HP_p))

                newData['stats.HP.value'] = TotalHP

                if (TotalHP > 0) {
                    if ((TotalHP + User.stats.HP.value) > HPMax) {
                        newData['stats.HP.value'] = (TotalHP + User.stats.HP.value) - HPMax
                    }
                }

                if (TotalHP < 0) {
                    if ((TotalHP - User.stats.HP.value) < 0) {
                        newData['stats.HP.value'] = -(User.stats.HP)
                    }
                }

                let TotalMP = 0
                if (DefaultActivate.MP) TotalMP = parseInt(DefaultActivate.MP)
                if (DefaultActivate.MP_p) TotalMP = TotalMP + ((User.stats.MP.value / 100) * parseInt(DefaultActivate.MP_p))
                if (DefaultActivate.MPMax) TotalMP = TotalMP + ((MPMax / 100) * parseInt(DefaultActivate.MPMax))

                newData['stats.MP.value'] = TotalMP

                if (TotalMP > 0) {
                    if ((TotalMP + User.stats.MP.value) > MPMax) {
                        newData['stats.MP.value'] = (TotalMP + User.stats.MP.value) - MPMax
                    }
                }

                if (TotalMP < 0) {
                    if ((TotalMP - User.stats.MP.value) < 0) {
                        newData['stats.MP.value'] = -(User.stats.MP)
                    }
                }

                if (DefaultActivate.RemoveEquips) DefaultActivate.RemoveEquips.forEach(async (ItemId) => await this.client.Database.Equips.deleteOne({ ItemId }))

                await this.client.Database.Users.updateOne({ UserId: User.UserId }, { $inc: newData })
            }

            // Server Setting Activate
            const ServerSetting = Activate.ServerSetting

            if (ServerSetting) {
                if (ServerSetting.GiveRoleIds) ServerSetting.GiveRoleIds.forEach((Id) => {
                    try {
                        member.roles.add(member.roles.cache.get(Id) as Role)
                    } catch { }
                })

                if (ServerSetting.GiveRoleNames) ServerSetting.GiveRoleNames.forEach((Name) => {
                    try {
                        member.roles.add(member.roles.cache.find((role) => role.name == Name) as Role)
                    } catch { }
                })

                if (ServerSetting.TakeRoleIds) ServerSetting.TakeRoleIds.forEach((Id) => {
                    try {
                        member.roles.remove(member.roles.cache.get(Id) as Role)
                    } catch { }
                })

                if (ServerSetting.TakeRoleNames) ServerSetting.TakeRoleNames.forEach((Name) => {
                    try {
                        member.roles.remove(member.roles.cache.find((role) => role.name == Name) as Role)
                    } catch { }
                })

                if (ServerSetting.MuteServer) member.voice.setMute(true)
                if (ServerSetting.MuteHeadsets) member.voice.setDeaf(true)

                if (ServerSetting.UnmuteServer) member.voice.setMute(false)
                if (ServerSetting.UnmuteHeadsets) member.voice.setDeaf(false)

                if (ServerSetting.Disconnect) member.voice.disconnect()
            }
        } catch (err) {
            this.client.log.try_catch_Handling('🔴', `Activate ${err}`)
            return { isEnd: true }
        }
    }

    async Attack(guild: Guild, User: IUser, Item: Activate, Target: IUser, IQ: number) {
        const LevelME: ILevel = await this.client.Database.Level.findOne({ LevelNo: User.stats.level.toString() }) as any
        const LevelTarget: ILevel = await this.client.Database.Level.findOne({ LevelNo: Target.stats.level.toString() }) as any
        const ME = await Calculator(this.client, User, LevelME)
        const {
            HPMax, HPR, HP_p, MPMax, MPR, MP_p,
            PoR, IPR, AM, MaR, EaR, WaR, AiR, FiR, LiR, IcR
        } = await Calculator(this.client, Target, LevelTarget)

        const { HP, MP } = await this.client.Utils.UpdateHP_MP(guild, Target, HPMax, MPMax, HPR, MPR, HP_p, MP_p)

        const { Venom, IPhysical, OPhysical, Magic, Dirt, Water, Wind, Fire, Lighting, Ice } = Item

        const Attacks = [Venom, IPhysical, OPhysical, Magic, Dirt, Water, Wind, Fire, Lighting, Ice]
        const specifyParameter = [PoR, IPR, AM, ME.MaD - MaR, ME.EaD - EaR, ME.WaD - WaR, ME.AiD - AiR, ME.FiD - FiR, ME.LiD - LiR, ME.IcD - IcR]

        let AttHP = 0
        let AttMP = 0
        let AttMax = 0

        for (let i = 0; i < Attacks.length; i++) {
            const Item = Attacks[i]
            const Parameter = specifyParameter[i]

            if (!Item) continue

            let ATHP = 0
            if (Item.ATHP) ATHP = parseFloat(Item.ATHP)
            if (Item.ATHPx) ATHP = ATHP + (ME.DM * parseFloat(Item.ATHPx))
            if (Item.ATHP_p) ATHP = ATHP + ((Target.stats.HP.value / 100) * parseFloat(Item.ATHP_p))
            if (Item.ATHPMax_p) ATHP = ATHP + ((HPMax / 100) * parseFloat(Item.ATHPMax_p))

            let ATMP = 0
            if (Item.ATMP) ATMP = parseFloat(Item.ATMP)
            if (Item.ATMPx) ATMP = ATMP + (ME.DM * parseFloat(Item.ATMPx))
            if (Item.ATMP_p) ATMP = ATMP + ((Target.stats.MP.value / 100) * parseFloat(Item.ATMP_p))
            if (Item.ATMPMax_p) ATMP = ATMP + ((HPMax / 100) * parseFloat(Item.ATMPMax_p))

            const AttMaxHP = (parseFloat(Item.ATHP ?? '0') + (ME.DM * parseFloat(Item.ATHPx ?? '0')) + ((HP / 100) * parseFloat(Item.ATHP_p ?? '0')) + ((HPMax / 100) * parseFloat(Item.ATHPMax_p ?? '0'))) * (IQ / 100)
            const AttMaxMP = (parseFloat(Item.ATMP ?? '0') + (ME.DM * parseFloat(Item.ATMPx ?? '0')) + ((MP / 100) * parseFloat(Item.ATMP_p ?? '0')) + ((MPMax / 100) * parseFloat(Item.ATMPMax_p ?? '0'))) * (IQ / 100)

            const SpecifyDecrease = i == 2 ? Parameter : (AttMaxHP / 100 * Parameter)

            AttHP += AttMaxHP - SpecifyDecrease
            AttMP += AttMaxMP - SpecifyDecrease

            AttMax += (AttMaxHP + AttMaxMP)
        }

        if (AttHP < 0) AttHP = 0
        if (AttMP < 0) AttMP = 0

        let Att = AttHP + AttMP

        await this.client.Database.Users.updateOne({ UserId: Target.UserId }, {
            $inc: {
                'stats.HP.value': -AttHP,
                'stats.MP.value': -AttMP
            }
        })

        await this.client.Utils.CheckHPisZero(guild, User.UserId)

        return { IQ: (100 / AttMax) * Att }
    }

    async DecreaseAttriute(ItemTarget: ItemBase, Item: TypeAB | TypeP | TypePA) {
        try {
            let Quality = 0

            if (Item.Quality.Enable && Item.ConditionItem.Deterioration) {
                if (!ItemTarget.Quality) Quality = parseInt(Item.Quality.Quality ?? '0')
                else Quality = ItemTarget.Quality

                Quality -= parseInt(Item.ConditionItem.Deterioration ?? '1')
            }

            if (Quality <= 0) {
                await this.client.Database.Inventorys.deleteOne({
                    UserId: ItemTarget.UserId,
                    ItemId: ItemTarget.ItemId,
                    ItemDate: ItemTarget.ItemDate,
                    ItemCount: ItemTarget.ItemCount
                })
            } else {
                await this.client.Database.Inventorys.updateOne({
                    UserId: ItemTarget.UserId,
                    ItemId: ItemTarget.ItemId,
                    ItemDate: ItemTarget.ItemDate,
                    ItemCount: ItemTarget.ItemCount
                }, {
                    $set: {
                        Quality: Quality
                    }
                })
            }

            return Quality
        } catch {
            return 0
        }
    }
}