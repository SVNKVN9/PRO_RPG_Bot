import { Collection } from "mongodb";
import { IGuild } from "../../types";

interface Filter {
    id: string
}

export default class Guild {
    private Cache: Map<string, { TTL: number, Guild: IGuild }>
    private TTL: number

    constructor(public Guilds: Collection) {
        this.Cache = new Map()
        this.TTL = 1000 * 60 * 60 * 4 // 2 hours

        this.ClearCache()
    }

    public RemoveCache(UserId: string) {
        this.Cache.delete(UserId)

        return true
    }

    private ClearCache() {
        setInterval(() => {
            const now = Date.now()

            this.Cache.forEach((Guild, id) => {
                if (Guild.TTL < now) return

                this.Cache.delete(id)
            })
        }, 30_000)
    }

    public async findOne(filter: Filter): Promise<IGuild> {
        if (!this.Cache.has(filter.id)) {
            try {
                let guild = await this.Guilds.findOne(filter) as any as IGuild

                if (!guild) {
                    guild = {
                        id: filter.id,
                        prefix: '.',
                        slashcommand: true,
                        TxActivate: true,
                        TxValue: '1',
                        Trade: true,
                        Attack: true,
                        KickWhenDie: true,
                        KickWhenMove: true,
                    }

                    await this.Guilds.insertOne(guild)
                }

                this.Cache.set(guild.id, { TTL: Date.now() + this.TTL, Guild: guild })

                return guild
            } catch (err) {
                console.log(`Error Try Catch Cache (Guild) : ${err}`)
            }
        }

        return this.Cache.get(filter.id)?.Guild as IGuild
    }
}