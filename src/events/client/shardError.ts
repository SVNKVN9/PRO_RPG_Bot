import Client from "../../structure/Client";

export default {
    name: 'shardError',
    execute: (client: Client, error: Error, id: number) => {
        client.log.Sharding('🔴', `Shard ${id} is shardError ${error}`)
    }
}