import { GuildMember } from "discord.js";
import { ItemEquip, ItemParameter, ItemsType, IUser, StatusType, TypeAB, TypeB, TypeP, TypePA, TypePD } from "../../../types";
import { ErrorEmbeds } from "../../../Utils/Components";
import awaitAccept from "../Function/awaitAccept";

export default async ({ client, Member, ItemTarget, interaction, Target, AcceptCheck }: ItemParameter): Promise<StatusType> => {
    const User: IUser = await client.Database.Users.findOne({ UserId: Member.id }) as any
    const Item = await client.Database.Items(ItemTarget.ItemId) as TypeP
    const ItemNameFormat = `${Item.Base.ItemId} ${Item.Base.EmojiId ?? ''} ${Item.Base.ItemName}`

    if (Target) {
        if (Member.voice.channel !== Target.voice.channel) return { isEnd: false, message: { embeds: [ErrorEmbeds.ChannelNotMatch(Target.user.id)] } }

        if (AcceptCheck) {
            const isAccept = await awaitAccept(interaction, Target.id, ItemNameFormat)

            if (isAccept.isEnd) return isAccept
        }
    }

    let ConditionOpenItem = await client.Executer.ConditionOpenItem(User, Member, Item, Item.ConditionItem, interaction, Target)

    if (ConditionOpenItem.isEnd) return ConditionOpenItem

    const isFull = async (User: GuildMember): Promise<StatusType> => {
        let raceCount = 0
        let bloodCount = 0
        let personal_elementCount = 0
        let super_powerCount = 0

        const Equips: ItemEquip[] = await client.Database.Equips.find({ UserId: User.id }).toArray() as any

        const Counter = (EquipPos: string) => {
            if (EquipPos == 'race') raceCount += 1
            if (EquipPos == 'blood') bloodCount += 1
            if (EquipPos == 'personal_element') personal_elementCount += 1
            if (EquipPos == 'super_power') super_powerCount += 1
        }

        for (let i of Equips) {
            const ItemData = await client.Database.Items(i.ItemId) as ItemsType

            const PassiveMe = (ItemData as TypeAB | TypeB).PassiveMe

            if (PassiveMe) Counter(PassiveMe.EquipPos)

            const PassiveTarget = (ItemData as TypePA | TypeP | TypePD).PassiveTarget

            if (PassiveTarget) Counter(PassiveTarget.EquipPos)

            if (i.ItemId == Item.Base.ItemId) return { isEnd: true, message: { content: '❌ ไม่สามารถใส่ไอเทมนี้ทับได้' } }
        }

        if (Item.PassiveTarget.EquipPos == 'race') if ((raceCount + 1) > 1) return { isEnd: true, message: { content: '❌ มีเผ่าพันธ์สวมใส่แล้ว' } }
        if (Item.PassiveTarget.EquipPos == 'blood') if ((bloodCount + 1) > 5) return { isEnd: true, message: { content: '❌ มีสายเลือดสวมใส่แล้ว' } }
        if (Item.PassiveTarget.EquipPos == 'personal_element') if ((personal_elementCount + 1) > 6) return { isEnd: true, message: { content: '❌ มีธาตุสวมใส่แล้ว' } }
        if (Item.PassiveTarget.EquipPos == 'super_power') if ((super_powerCount + 1) > 5) return { isEnd: true, message: { content: '❌ มีพลังพิเศษสวมใส่แล้ว' } }

        if (!Item.PassiveTarget.StatusAge) await client.Database.Equips.insertOne({ ...ItemTarget, UserId: User.id, })

        return { isEnd: false }
    }

    let Quality = await client.Executer.DecreaseAttriute(ItemTarget, Item)

    if (!Target) {
        let Passive = await client.Executer.Passive(interaction, User.UserId, ItemTarget, Item.PassiveTarget, Quality)

        if (Passive.isEnd) return Passive

        let isPass = await isFull(Member)

        if (isPass.isEnd) return isPass
    } else {
        let Passive = await client.Executer.Passive(interaction, Target.user.id, ItemTarget, Item.PassiveTarget, Quality, !AcceptCheck)

        if (Passive.isEnd) return Passive

        let isPass = await isFull(Target)

        if (isPass.isEnd) return isPass
    }

    if (ConditionOpenItem.MPUse) await client.Database.Users.updateOne({ UserId: Member.id }, {
        $inc: { 'stats.MP.value': -ConditionOpenItem.MPUse }
    })

    try {
        if ((Item.ConditionItem.FinishMessage || {}).EveryOneCanSee) {
            await interaction.deleteReply()
            await interaction.channel?.send(ConditionOpenItem.message || { content: '✅ สำเร็จเสร็จสิ้น ✅' }).then(message => setTimeout(() => message.delete(), 10_000))
        }
        else await interaction.editReply(ConditionOpenItem.message || { content: '✅ สำเร็จเสร็จสิ้น ✅' })

        if (!Target || AcceptCheck) await Member.send(ConditionOpenItem.message || { content: '✅ สำเร็จเสร็จสิ้น ✅' })
    } catch { }

    return { isEnd: false }
}