import { Snowflake } from "discord.js";
import Client from "../../structure/Client";

export default {
    name: 'shardReconnecting',
    execute: (client: Client, id: number) => {
        client.log.Sharding('🔴', `Shard ${id} is reconnecting`)
    }
}