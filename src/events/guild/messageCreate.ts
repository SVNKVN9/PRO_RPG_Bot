import { Message } from "discord.js";
import Client from "../../structure/Client";
import { IUser } from "../../types";
import AddMember from "../../Utils/AddMember";

export default {
    name: 'messageCreate',
    execute: async (client: Client, message: Message) => {
        if (!message.guild) {
            const args = message.content.trim().split(/ +/);
            const commandName = (args.shift() as string).toLowerCase();

            const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName) as string)

            if (!command) return

            if (!command.DMchat) return message.reply({ content: `**คำสั่งนี้ไม่สามารถใช้ได้ใน DM**` })

            await AddMember(client, message.author.id)

            const User = await client.Database.Users.findOne({ UserId: message.author.id }) as any as IUser

            if (User.suspend) return message.reply({ content: '❌ บัญชีของคุณถูกระงับ' })
                
            try {
                // client.log.ExecutedCommand("🟢", `Command: ${commandName} Executed by <@${message.author.id}>`)

                return command.execute(client, message, args)
            } catch (err) {
                return client.log.ExecutedCommand("🔴", `execute command Error: ${err} <@${message.author.id}>`)
            }
        }

        if (message.author.bot) return

        const { prefix } = await client.Database.Guilds.findOne({ id: message.guild.id })
        
        if (prefix == '') return
        if (!message.content.startsWith(prefix ?? '!')) return

        const args = message.content.slice(prefix ? prefix.length : '!'.length).trim().split(/ +/);
        const commandName = (args.shift() as string).toLowerCase();

        const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName) as string)

        if (!command) return

        await AddMember(client, message.author.id)

        const User = await client.Database.Users.findOne({ UserId: message.author.id }) as any as IUser

        if (User.suspend) return message.reply({ content: '❌ บัญชีของคุณถูกระงับ' })
        
        try {
            // client.log.ExecutedCommand("🟢", `Command: ${commandName} Executed by <@${message.author.id}>`)

            command.execute(client, message, args)
        } catch (err) {
            client.log.ExecutedCommand("🔴", `execute command Error: ${err} <@${message.author.id}>`)
        }
    }
}