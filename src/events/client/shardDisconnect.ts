import { CloseEvent } from "discord.js";
import Client from "../../structure/Client";

export default {
    name: 'shardDisconnect',
    execute: (client: Client, event: CloseEvent, id: number) => {
        client.log.Sharding('🔴', `Shard ${id} is Disconnect ${event.reason}`)

        client.restart()
    }
}