import { ItemParameter, IUser, StatusType, TypeB } from "../../../types";
import { ErrorEmbeds } from "../../../Utils/Components";
import awaitAccept from "../Function/awaitAccept";

export default async ({ client, Member, ItemTarget, interaction, Target, AcceptCheck }: ItemParameter): Promise<StatusType> => {
    const User: IUser = await client.Database.Users.findOne({ UserId: Member.id }) as any
    const Item = await client.Database.Items(ItemTarget.ItemId) as TypeB
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

    if (!Target) {
        let Passive = await client.Executer.Passive(interaction, User.UserId, ItemTarget, Item.PassiveMe, 100)

        if (Passive.isEnd) return Passive
    } else {
        let Passive = await client.Executer.Passive(interaction, Target.user.id, ItemTarget, Item.PassiveMe, 100, !AcceptCheck)

        if (Passive.isEnd) return Passive
    }

    if (ConditionOpenItem.MPUse) await client.Database.Users.updateOne({ UserId: Member.id }, {
        $inc: { 'stats.MP.value': -ConditionOpenItem.MPUse }
    })

    return { isEnd: false, message: { content: '✅ สำเร็จเสร็จสิ้น ✅' } }
}