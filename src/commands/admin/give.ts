import { Message, MessageEditOptions } from "discord.js";
import Client from "../../structure/Client";
import GiveItem from "../../Utils/give";

export default {
    name: 'give',
    execute: async (client: Client, message: Message, args: string[]) => {
        if (!client.config.OnwerIds.includes(message.author.id)) return

        if (!args.length) return message.reply({ content: '<Prefix>give <ItemId> <Member> <quantity> ' })

        let msg = await message.channel.send({ content: '**โปรดรอ...**' })

        let ItemId = args[0]
        let UserId = args[1] ?? message.author.id
        let quantity = args[2] || '1' // quantity

        const isUser = await client.Database.Users.findOne({ UserId: UserId })

        if (!isUser) return msg.edit({ content: '❌ ไม่มีผู้ใช้นี้ในระบบ' })

        const { Message } = await GiveItem(client, message.author.id, UserId, ItemId, parseInt(quantity))

        msg.edit({ content: '', ...Message as MessageEditOptions })
    }
}