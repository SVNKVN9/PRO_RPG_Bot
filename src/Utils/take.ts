import { EmbedBuilder, MessageCreateOptions, codeBlock } from "discord.js";
import Client from "../structure/Client";
import { ItemBase } from "../types";

export default async (client: Client, ownId: string | null, UserId: string, ItemId: string, quantity: number): Promise<{ Message: MessageCreateOptions, data: ItemBase[] }> => {
    const AllItem: ItemBase[] = await client.Database.Inventorys.find({ UserId: UserId, ItemId: ItemId }).toArray() as any
    const isItems = AllItem.sort((a, b) => b.CreateTimestramp - a.CreateTimestramp)

    if (isItems.length < quantity) return {
        Message: { content: 'มีไอเทมไม่พอในการลบ' },
        data: []
    }

    const removed = isItems.splice(0, quantity)

    await Promise.all([removed.map(async item => await client.Database.Inventorys.deleteOne(item))])
    const ItemData = await client.Database.Items(ItemId) as any

    const Description = [`⭕ <@${ownId ?? client.user?.id}> เอาไอเทมออกจาก <@${UserId}> สำเร็จ ✅`]
    Description.push(`\n${ItemData.Base.ItemId}${ItemData.Base.EmojiId ?? ''}${ItemData.Base.ItemName}`)

    return {
        Message: {
            content: '',
            embeds: [
                new EmbedBuilder()
                    .setTimestamp()
                    .setColor('#000000')
                    .setDescription(`${Description.join('\n')}\n${codeBlock('ml', `${removed.length > 50 ? `จำนวน ${removed.length}` : removed.map((value, index) => `${index + 1}. ${value.ItemId}-${value.ItemDate}-${value.ItemCount}`).join('\n')}`)}`)
            ]
        },
        data: removed
    }
}