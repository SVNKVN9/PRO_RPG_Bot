import { VoiceState } from "discord.js";
import Client from "../../structure/Client";
import AddMember from "../../Utils/AddMember";

export default {
    name: 'voiceStateUpdate',
    execute: async (client: Client, oldState: VoiceState, newState: VoiceState) => {
        if (oldState.channelId == newState.channelId) return

        await AddMember(client, newState.member?.id as string)

        if (oldState.channelId && newState.channelId) { // move
            await client.Connection.Leave(oldState)
            await client.Connection.Join(newState)
        }

        if (!newState.channelId && oldState.channelId) await client.Connection.Leave(oldState) // leave
        
        if (newState.channelId && !oldState.channelId) await client.Connection.Join(newState) // join
    }
}