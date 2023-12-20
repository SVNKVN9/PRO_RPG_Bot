import { Message, MessageCreateOptions } from "discord.js";
import Client from "../../structure/Client";
// import { InfoExecute } from "../../Utils/Info";

export default {
    name: 'info',
    DMchat: true,
    execute: async (client: Client, message: Message, args: string[]) => {
        const ItemId = args[0]

        // const result = await InfoExecute(client, message.author.id, ItemId) as MessageCreateOptions

        // return message.channel.send(result)
    }
}

