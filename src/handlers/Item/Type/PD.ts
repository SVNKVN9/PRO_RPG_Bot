import { ItemParameter, IUser, StatusType, TypePD } from "../../../types";
import { ErrorEmbeds } from "../../../Utils/Components";
import awaitAccept from "../Function/awaitAccept";

export default async ({ client, Member, ItemTarget, interaction, Target, AcceptCheck }: ItemParameter): Promise<StatusType> => {
    const User: IUser = await client.Database.Users.findOne({ UserId: Member.id }) as any
    const Item = await client.Database.Items(ItemTarget.ItemId) as TypePD
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

    // // Decrease Attribute
    let Quality = 100
    // if (Item.Quality.Enable && Item.ConditionItem.Deterioration) {
    //     if (!ItemTarget.Quality) Quality = parseInt(Item.Quality.Quality ?? '0')
    //     else Quality = ItemTarget.Quality

    //     Quality -= parseInt(Item.ConditionItem.Deterioration ?? '1')
    // }

    // if (Quality <= 0) {
    //     await client.Database.Inventorys.deleteOne({
    //         UserId: ItemTarget.UserId,
    //         ItemId: ItemTarget.ItemId,
    //         ItemDate: ItemTarget.ItemDate,
    //         ItemCount: ItemTarget.ItemCount
    //     })
    // } else {
    //     await client.Database.Inventorys.updateOne({
    //         UserId: ItemTarget.UserId,
    //         ItemId: ItemTarget.ItemId,
    //         ItemDate: ItemTarget.ItemDate,
    //         ItemCount: ItemTarget.ItemCount
    //     }, {
    //         $set: {
    //             Quality: Quality
    //         }
    //     })
    // }

    if (!Target) {
        let Passive = await client.Executer.Passive(interaction, User.UserId, ItemTarget, Item.PassiveTarget, Quality)

        if (Passive.isEnd) return Passive

        await client.Database.Equips.insertOne({ ...ItemTarget, UserId: Member.id })
    } else {
        let Passive = await client.Executer.Passive(interaction, Target.user.id, ItemTarget, Item.PassiveTarget, Quality, !AcceptCheck)

        if (Passive.isEnd) return Passive

        await client.Database.Equips.insertOne({ ...ItemTarget, UserId: Target.id })
    }

        try {
        if ((Item.ConditionItem.FinishMessage || {}).EveryOneCanSee) {
            await interaction.deleteReply()
            await interaction.channel?.send(ConditionOpenItem.message || { content: '✅ สำเร็จเสร็จสิ้น ✅' }).then(message => setTimeout(() => message.delete(), 10_000))
        }
        else await interaction.editReply(ConditionOpenItem.message || { content: '✅ สำเร็จเสร็จสิ้น ✅' })

        if (!Target || AcceptCheck) await Member.send(ConditionOpenItem.message || { content: '✅ สำเร็จเสร็จสิ้น ✅' })
    } catch { }

    if (ConditionOpenItem.MPUse) await client.Database.Users.updateOne({ UserId: Member.id }, {
        $inc: { 'stats.MP.value': -ConditionOpenItem.MPUse }
    })

    return { isEnd: false }
}