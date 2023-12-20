import Client from "../../structure/Client"
import { Message } from 'discord.js'
import { SecondRow, StatusEmbed, StatusSelectMenu } from "../../handlers/Status/Rander"
import { IUser } from "../../types"

export default {
    name: 'status',
    aliases: ['sta'],
    DMchat: true,
    execute: async (client: Client, message: Message, args: string[]) => {
        let UserId = message.author.id

        if (args.length) {
            if (!client.config.OnwerIds.includes(message.author.id)) return message.channel.send({ content: `<@${message.author.id}> **คุณไม่สามารถเช็คข้อมูลของคนอื่นได้**` }).then((msg) => setTimeout(() => msg.delete().then(() => message.delete()), 5000))
            
            UserId = args[0]
        }

        const { HGD, HGF } = await client.Utils.UpdateHG(UserId)
        const User = await client.Database.Users.findOne({ UserId: UserId }) as any as IUser
        
        const Embed = await StatusEmbed(client, User, HGD, HGF)

        const msg = await message.channel.send({ embeds: [Embed], components: [StatusSelectMenu(UserId)] })

        setTimeout(() => msg.delete(), 1000 * 60 * 5)
    }
}