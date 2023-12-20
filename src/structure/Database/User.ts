import { Collection, Document, UpdateFilter } from "mongodb";
import { IUser } from "../../types";
import Client from "../Client";

interface Filter {
    UserId: string | undefined
}

export default class User {
    private Cache: Map<string, { TTL: number, User: IUser }>
    private TTL: number

    constructor(public User: Collection, private client: Client) {
        this.Cache = new Map()
        this.TTL = 1000 * 60 * 60 * 2 // 2 hours

        this.ClearCache()
    }

    public RemoveCache(UserId: string) {
        this.Cache.delete(UserId)

        return true
    }

    private ClearCache() {
        setInterval(() => {
            const now = Date.now()

            this.Cache.forEach((User, UserId) => {
                if (User.TTL < now) return

                this.Cache.delete(UserId)
            })
        }, 30_000)
    }

    public async insertOne(User: IUser): Promise<IUser> {
        this.Cache.set(User.UserId, { TTL: Date.now() + this.TTL, User })

        await this.User.insertOne(User)

        return User
    }

    public async findOne(filter: Filter): Promise<IUser | undefined> {
        if (!filter.UserId) return

        const user = this.Cache.has(filter.UserId)

        if (!user) {
            try {
                const user = await this.User.findOne(filter) as any as IUser

                this.Cache.set(user.UserId, { TTL: Date.now() + this.TTL, User: user })

                return user
            } catch {
                return
            }
        }

        return this.Cache.get(filter.UserId)?.User
    }

    public async updateOne(filter: Filter, update: Partial<Document> | UpdateFilter<Document>): Promise<IUser | undefined> {
        if (!filter.UserId) return

        for (const [key, value] of Object.entries(update)) {
            if (typeof value != 'number') continue
            if (Number.isNaN(value)) {
                this.client.log.ErrorHandling('🟡', `Mongodb is NaN value in ${key}:${value} <@625538855067713537>`)
            }
        }

        await this.User.updateOne(filter, update)

        const user = await this.User.findOne(filter) as any as IUser

        this.Cache.set(filter.UserId, { TTL: Date.now() + this.TTL, User: user })

        return user
    }

    public async deleteOne(filter: Filter) {
        if (!filter.UserId) return

        this.Cache.delete(filter.UserId)

        return await this.User.deleteOne(filter)
    }
}