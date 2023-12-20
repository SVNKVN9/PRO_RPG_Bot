import { Message, MessageEditOptions } from "discord.js";
import Client from "../../structure/Client";
import GiveItem from "../../Utils/give";

export default {
    name: 'give',
    execute: async (client: Client, message: Message, args: string[]) => {
        if (!client.config.OnwerIds.includes(message.author.id)) return

        if (!args.length) return message.reply({ content: '<Prefix>give <ItemId> <quantity> <Member>' })

        let msg = await message.channel.send({ content: '**โปรดรอ...**' })

        const ItemId = args[0]
        const quantity = args[1] || '1' // quantity
        const UserId = args[2] ?? message.author.id

        const isUser = await client.Database.Users.findOne({ UserId: UserId })

        if (!isUser) return msg.edit({ content: '❌ ไม่มีผู้ใช้นี้ในระบบ' })

        const { Message } = await GiveItem(client, message.author.id, UserId, ItemId, parseInt(quantity))

        msg.edit({ content: '', ...Message as MessageEditOptions })
    }
}