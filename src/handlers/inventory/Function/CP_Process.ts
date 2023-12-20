import Client from "../../../structure/Client";
import { ItemBase, ItemsType } from "../../../types";

export default async (client: Client, Items: ItemBase[]) => {
    const ItemCache = new Map<string, any>()
    let CP = 0

    for (let Item of Items) {
        if (!ItemCache.has(Item.ItemId)) {
            const ItemData = await client.Database.Items(Item.ItemId) as ItemsType 

            ItemCache.set(Item.ItemId, ItemData)
        }

        const ItemData = ItemCache.get(Item.ItemId)

        CP = CP + (ItemData.Base.Size ? parseInt(ItemData.Base.Size) : 1)
    }

    return CP
}