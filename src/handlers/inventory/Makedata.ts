import Client from "../../structure/Client"
import { ItemBase } from "../../types"

export interface Inventory {
    Id: string,
    Name: string,
    Index: number,
    Items: Map<string, { length: number, data: any }>
}

export const MakeData = async (client: Client, Inventory: ItemBase[]): Promise<Inventory[]> => {
    const fetch_group = await client.Database.Groups()
    const groups = fetch_group.map(group => ({
        Id: group.Id,
        Name: group.Name,
        Index: group.Index,
        Items: new Map()
    })) as Inventory[]
    
    groups.sort((a, b) => a.Index - b.Index)

    const ItemCache = new Map<string, any>()

    for(let item of Inventory.filter(Item => !Item.Select)) {
        let isMap = ItemCache.get(item.ItemId)

        if (isMap) {
            let g = groups.find(group => group.Id == isMap.groupId) as Inventory
            let ItemMap = groups[groups.findIndex(value => value.Id == g.Id)].Items
            
            ItemMap.set(item.ItemId, { length: (ItemMap.get(item.ItemId)?.length as number) + 1, data: isMap })
        } else {
            let ItemData: any = await client.Database.Items(item.ItemId)
            ItemCache.set(item.ItemId, ItemData)
            
            try {
                let g = groups.find(group => group.Id == ItemData.groupId) as Inventory

                groups[groups.findIndex((value) => value.Id == g.Id)].Items.set(item.ItemId, { length: 1, data: ItemData })
            } catch (err) {
                client.log.try_catch_Handling('🔴', `${item.ItemId} : ${err}`)
            }
        }
    }

    return groups
}