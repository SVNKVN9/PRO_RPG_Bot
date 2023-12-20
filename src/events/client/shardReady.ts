import { Snowflake } from "discord.js";
import Client from "../../structure/Client";

export default {
    name: 'shardReady',
    execute: async (client: Client, id: number, unavailableGuilds: Set<Snowflake>) => {
        client.log.Sharding('🟢', `Shard ${id} is Ready ${unavailableGuilds}`)

        unavailableGuilds = new Set()

        if (unavailableGuilds.size != 0) {
            client.restart()
        }
    }
}