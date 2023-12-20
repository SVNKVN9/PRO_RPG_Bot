import { Snowflake } from "discord.js";
import Client from "../../structure/Client";

export default {
    name: 'shardResume',
    execute: (client: Client, id: number, replayedEvents: number) => {
        client.log.Sharding('🔴', `Shard ${id} is resume ${replayedEvents}`)
    }
}