import { ItemParameter, IUser, StatusType, TypePA } from "../../../types";
import { ErrorEmbeds } from "../../../Utils/Components";
import awaitAccept from "../Function/awaitAccept";

export default async ({ client, Member, ItemTarget, interaction, Target, AcceptCheck }: ItemParameter): Promise<StatusType> => {
    const User: IUser = await client.Database.Users.findOne({ UserId: Member.id }) as any
    const Item = await client.Database.Items(ItemTarget.ItemId) as TypePA
    const ItemNameFormat = `${Item.Base.ItemId} ${Item.Base.EmojiId ?? ''} ${Item.Base.ItemName}`

    if (Target) {
        if (Target.id == Member.id) return { isEnd: false, message: { embeds: [ErrorEmbeds.ActionSelf()] } }
        if (Member.voice.channel !== Target.voice.channel) return { isEnd: false, message: { embeds: [ErrorEmbeds.ChannelNotMatch(Target.user.id)] } }

        if (AcceptCheck) {
            const isAccept = await awaitAccept(interaction, Target.id, ItemNameFormat)

            if (isAccept.isEnd) return isAccept
        }
    }

    let ConditionOpenItem = await client.Executer.ConditionOpenItem(User, Member, Item, Item.ConditionItem, interaction, Target)

    if (ConditionOpenItem.isEnd) return ConditionOpenItem

    let Quality = await client.Executer.DecreaseAttriute(ItemTarget, Item)

    if (!Target) {
        let Passive = await client.Executer.Passive(interaction, User.UserId, ItemTarget, Item.PassiveTarget, Quality)

        if (Passive.isEnd) return Passive

        await client.Executer.Activate(User, Member, Item.Activate)
    } else {
        const target: IUser = await client.Database.Users.findOne({ UserId: Target.id }) as any

        if (!AcceptCheck) {
            let ConditionTarget = await client.Executer.ConditionTarget(target, Target, Item)

            if (ConditionTarget.isEnd) return ConditionTarget

            const { IQ } = await client.Executer.Attack(Member.guild, User, Item.Activate, target, ItemTarget.Quality)

            Quality = IQ
        }

        let Passive = await client.Executer.Passive(interaction, Target.user.id, ItemTarget, Item.PassiveTarget, Quality, !AcceptCheck)

        if (Passive.isEnd) return Passive

        await client.Executer.Activate(target, Member, Item.Activate)
    }
    
    if (ConditionOpenItem.MPUse) {
        let Id = AcceptCheck ? Target?.id : Member.id

        await client.Database.Users.updateOne({ UserId: Id }, {
            $inc: { 'stats.MP.value': -ConditionOpenItem.MPUse }
        })
    }

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