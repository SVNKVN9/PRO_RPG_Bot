import { Collection, UpdateFilter } from "mongodb"
import { ItemBase } from "../../types"

interface Filter {
    UserId?: string
    ItemId?: string
    ItemDate?: string
    ItemCount?: number
}

export default class Inventory {
    private Cache: { TTL: number, data: ItemBase }[]
    private TTL: number

    constructor(public Inventory: Collection) {
        this.Cache = []
        this.TTL = 1000 * 60 * 60 * 6 // 6 hours

        // this.ClearCache()
    }

    // private ClearCache() {
    //     setInterval(() => {
    //         const now = Date.now()

    //         this.Cache.forEach((Inventory) => {
    //             if (Inventory.TTL < now) return

    //             this.Cache.delete(UserId)
    //         })


    //     }, 30_000)
    // }

    // public async insertMany(Items: ItemBase[]) {
    //     const UserId = Items[0].UserId
    //     await this.Inventory.insertMany(Items)

    //     const Inventory = await this.Inventory.find({ UserId }).toArray() as any as ItemBase[]

    //     this.Cache.set(UserId, { TTL: Date.now() + this.TTL, Inventory })
    // }

    // public async find(filter: Filter): Promise<ItemBase[]> {
    //     const { UserId, ItemCount, ItemDate, ItemId } = filter

    //     if (this.Cache.has(filter.UserId)) {
    //         const data = this.Cache.get(filter.UserId) as { TTL: number, Inventory: ItemBase[] }

    //         const Inventory = data.Inventory.filter((Item) =>
    //             (Item.ItemId == ItemId) &&
    //             (Item.ItemDate == ItemDate) &&
    //             (Item.ItemCount == ItemCount)
    //         )

    //         this.Cache.set(UserId, { TTL: Date.now() + this.TTL, Inventory: data.Inventory })

    //         return Inventory as ItemBase[]
    //     }

    //     const Inventory = await this.Inventory.find({ UserId }).toArray() as any as ItemBase[]

    //     this.Cache.set(UserId, { TTL: Date.now() + this.TTL, Inventory })

    //     return Inventory
    // }

    // public async findOne(filter: Filter): Promise<ItemBase | undefined> {
        // const { UserId, ItemCount, ItemDate, ItemId } = filter

        // if (this.Cache.has(filter.UserId)) {
        //     const data = this.Cache.get(filter.UserId) as { TTL: number, Inventory: ItemBase[] }

        //     const Inventory = data.Inventory.find((Item) =>
        //         (Item.ItemId == ItemId) &&
        //         (Item.ItemDate == ItemDate) &&
        //         (Item.ItemCount == ItemCount)
        //     )

        //     this.Cache.set(UserId, { TTL: Date.now() + this.TTL, Inventory: data.Inventory })

        //     return Inventory as ItemBase
        // }

        // const data = await this.Inventory.find({ UserId }).toArray() as any as ItemBase[]

        // const Inventory = data.find((Item) =>
        //     (Item.ItemId == ItemId) &&
        //     (Item.ItemDate == ItemDate) &&
        //     (Item.ItemCount == ItemCount)
        // )

        // this.Cache.set(UserId, { TTL: Date.now() + this.TTL, Inventory: data })

        // return Inventory
    // }

    // public async updateOne(filter: Filter, update: Partial<Document> | UpdateFilter<Document>) {
        // await this.Inventory.updateOne(filter, update)

        // const Inventory = await this.Inventory.find({ UserId: filter.UserId }).toArray() as any as ItemBase[]

        // this.Cache.set(filter.UserId, { TTL: Date.now() + this.TTL, Inventory })

        // return true
    // }

    // public async deleteOne(filter: Filter) {
        // await this.Inventory.deleteOne(filter)

        // const Inventory = await this.Inventory.find({ UserId: filter.UserId }).toArray() as any as ItemBase[]

        // this.Cache.set(filter.UserId, { TTL: Date.now() + this.TTL, Inventory })

        // return true
    // }
}