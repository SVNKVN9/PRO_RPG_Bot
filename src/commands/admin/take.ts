import { Message, MessageEditOptions  } from "discord.js";
import Client from "../../structure/Client";
import take from "../../Utils/take";

export default {
    name: 'take',
    execute: async (client: Client, message: Message, args: string[]) => {
        if (!client.config.OnwerIds.includes(message.author.id)) return

        if (!args.length) return message.reply({ content: '!take <Member> <ItemId> <quantity>' })

        let msg = await message.channel.send({ content: '**โปรดรอ...**' })

        let UserId = args[0] // Member
        let ItemId = args[1] // ItemId
        let quantity = parseInt(args[2] || '1') // quantity

        const { Message } = await take(client, message.author.id, UserId, ItemId, quantity)

        msg.edit(Message as MessageEditOptions)
    }
}