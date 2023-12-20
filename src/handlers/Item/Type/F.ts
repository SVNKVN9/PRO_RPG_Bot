import { FarmOptions, FarmChannel, FarmDetail, IUser, StatusType, ItemParameter, TypeF } from "../../../types"
import { CreateId, DHMStoSec } from "../../../Utils/Function"
import { FarmMessage } from "../../../handlers/Farm/FarmMessage"

export default async ({ client, Member, ItemTarget, interaction, Target, AcceptCheck }: ItemParameter): Promise<StatusType> => {
    const user: IUser = await client.Database.Users.findOne({ UserId: Member.id }) as any
    const Item: TypeF = await client.Database.Items(ItemTarget.ItemId) as any
    const FarmChannel = await client.Database.FarmChannels.findOne({ Id: interaction.channelId }) as any as FarmChannel
    const Channel = interaction.options.get('ช่อง')?.channel

    // Check can build this channel
    if (!FarmChannel) return { isEnd: true, message: { content: 'ช่องนี้ไม่สามารถปลูกได้' } }
    let TotalSize = 0

    for (let FarmId of FarmChannel.FarmIds) {
        const Farm = await client.Database.Farm.findOne({ Id: FarmId }) as any as FarmOptions

        if (!Farm) {
            await client.Database.FarmChannels.updateOne({ Id: interaction.channelId }, { $pull: { FarmIds: FarmId } })
            continue
        }

        const Item = await client.Database.Items(Farm.ItemId) as any as TypeF

        TotalSize = TotalSize + parseInt(Item.FarmProperties.Area as string)
    }

    if (TotalSize + parseInt(Item.FarmProperties.Area as string) > FarmChannel.size) return { isEnd: true, message: { content: "ช่องนี้มีพื่นที่ปลูกไม่เพียงพอ" } }

    // Condition OpenItem
    const ConditionOpenItem = await client.Executer.ConditionOpenItem(user, Member, Item, Item.ConditionItem, interaction)
    
    if (ConditionOpenItem.isEnd == true) return ConditionOpenItem

    // Create FarmOptions and insert into Database
    const ID = CreateId(16)

    const Items: FarmDetail[] = Item.FarmRandom.map(FarmRandom => {
        return {
            ItemId: FarmRandom.ItemId as string,
            Counted: 0,
            MaxCount: parseInt(FarmRandom.GiveCount as string),
            CropPerTime: 0,
            startTime: Date.now() + DHMStoSec(FarmRandom.CropTime) * 1000,
            resetTime: Date.now() + DHMStoSec(FarmRandom.InTime_Global) * 1000,
            expireTime: FarmRandom.ExpireTime ? ( Date.now() + DHMStoSec(FarmRandom.ExpireTime) * 1000 ) : 0
        }
    })

    await client.Database.Farm.insertOne({
        Id: ID,
        VoiceId: Channel?.id,
        ItemId: Item.Base.ItemId,
        Timeout: Date.now() + DHMStoSec(Item.FarmProperties.Age) * 1000,
        Items: Items
    })

    const MessageOption = await FarmMessage(client, Item, ID)

    const msg = await interaction.channel?.send(MessageOption)

    await client.Database.Farm.updateOne({ Id: ID }, { $set: { ChannelId: msg?.channelId, MessageId: msg?.id } })
    await client.Database.FarmChannels.updateOne({ Id: interaction.channel?.id }, { $push: { FarmIds: ID }, })

    await client.Database.Users.updateOne({ UserId: Member.id }, {
        $inc: { 'stats.MP.value': -(ConditionOpenItem.MPUse as number) }
    })

    return { isEnd: false, message: { content: '✅ สำเร็จเสร็จสิ้น ✅' } }
}