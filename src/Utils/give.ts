import { codeBlock, EmbedBuilder } from "@discordjs/builders";
import { Colors, MessageCreateOptions } from "discord.js";
import { ItemBase } from "../types";
import Client from "../structure/Client";
import { ObjectId } from "mongodb";

export default async (client: Client, ownId: string | null, UserIds: string | string[], ItemId: string, quantity: number): Promise<{ Message: MessageCreateOptions, data: ItemBase[] }> => {
    try {
        let date = new Date()
        let day: number | string = date.getDate()
        let month: number | string = date.getMonth() + 1
        let year = date.getFullYear().toString().split("")

        if (day < 10) day = `0${day}`
        if (month < 10) month = `0${month}`

        let ItemDate = `${day}${month}${year[2]}${year[3]}`

        const Items = await client.Database.Inventorys.find({ ItemDate: ItemDate, ItemId: ItemId }).toArray() as ItemBase[]
        const Equips = await client.Database.Equips.find({ ItemDate: ItemDate, ItemId: ItemId }).toArray() as ItemBase[]
        const Effects = await client.Database.Effect.find({ ItemDate: ItemDate, ItemId: ItemId }).toArray() as ItemBase[]
        const isItem = await client.Database.Items(ItemId)

        if (!isItem) return {
            Message: {
                content: '❌ ไม่พบไอเทมนี้ในระบบ'
            },
            data: []
        }

        const ItemCount = [...Items, ...Equips, ...Effects].reduce((max, Item) => Item.ItemCount > max ? Item.ItemCount : max, Items[0] ? Items[0].ItemCount : 0)

        let InputData: ItemBase[] = []

        if (Array.isArray(UserIds)) {
            for (let UserId of UserIds) {
                for (let i = 0; i < quantity; i++) {
                    InputData.push({
                        _id: new ObjectId(),
                        UserId: UserId,
                        ItemId: ItemId,
                        ItemDate: ItemDate,
                        ItemCount: ItemCount + i + 1,
                        CreateTimestramp: Date.now(),
                        Locked: false,
                        Select: false,
                        Quality: 100,
                    })
                }
            }

            await client.Database.Inventorys.insertMany(InputData)

            return {
                Message: {  },
                data: []
            }
        } else {
            for (let i = 0; i < quantity; i++) {
                InputData.push({
                    _id: new ObjectId(),
                    UserId: UserIds,
                    ItemId: ItemId,
                    ItemDate: ItemDate,
                    ItemCount: ItemCount + i + 1,
                    CreateTimestramp: Date.now(),
                    Locked: false,
                    Select: false,
                    Quality: 100
                })
            }

            await client.Database.Inventorys.insertMany(InputData)
            const ItemData = await client.Database.Items(ItemId) as any

            const Description = [`🎁 <@${ownId ?? client.user?.id}> ให้ไอเทมกับ <@${UserIds}> สำเร็จ ✅`]
            Description.push(`\n${ItemData.Base.ItemId}${ItemData.Base.EmojiId ?? ''}${ItemData.Base.ItemName}`)

            return {
                Message: {
                    embeds: [
                        new EmbedBuilder()
                            .setTimestamp()
                            .setColor(Colors.White)
                            .setDescription(`${Description.join('\n')}\n${codeBlock('ml', `${InputData.length > 50 ? `จำนวน ${InputData.length}` : InputData.map((value, index) => `${index + 1}. ${value.ItemId}-${value.ItemDate}-${value.ItemCount}`).join('\n')}`)}`)
                    ]
                },
                data: InputData
            }
        }
    } catch (err) {
        return {
            Message: {
                content: `เกิดข้อผิดพลาด ${err}`
            },
            data: []
        }
    }
}