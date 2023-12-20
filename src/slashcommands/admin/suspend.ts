import { Collection, CommandInteraction, GuildMember, PermissionFlagsBits, Role, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('suspend')
            .setDescription('ระงับบัญชี')
            .addUserOption(option => option
                .setName('user')
                .setDescription('ผู้ใช้')
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName('description')
                .setDescription('รายละเอียด')
            ),

        new SlashCommandBuilder()
            .setName('unsuspend')
            .setDescription('ยกเลิกระงับบัญชี')
            .addUserOption(option => option
                .setName('user')
                .setDescription('ผู้ใช้')
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName('description')
                .setDescription('รายละเอียด')
            )
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        const { commandName } = interaction
        const user = interaction.options.getMember('user') as GuildMember
        const description = interaction.options.get('description')?.value

        const isRole = ( interaction.member?.roles.valueOf() as Collection<string, Role> ).get('1088741155690258522')

        if (!isRole) {
            if (!client.config.OnwerIds.includes(interaction.user.id)) {
                if (!client.config.SuspendIds.includes(interaction.user.id)) return interaction.reply({ ephemeral: true, content: 'คุณไม่มีสิทธิในการใช้คำสั่งนี้' })
            }
        }

        if (commandName == 'suspend') {
            await client.Database.Users.updateOne({ UserId: user.user.id }, { $set: { suspend: true } })

            const text = `> ❌คุณ <@${user.user.id}> โดนระงับบัญชี\n> ❗หมายเหตุ : ${description ?? ''}`

            try {
                const channel = client.channels.cache.get('1088740639157538816') || await client.channels.fetch('1088740639157538816')

                if (channel?.isTextBased()) {
                    channel.send({ content: text })
                }
            } catch { }

            await user.send({ content: text })

            return interaction.reply({ content: `> ❌ ระงับบัญชีของ <@${user.user.id}> แล้ว\n> ❗หมายเหตุ : ${description ?? ''}` })
        }

        if (commandName == 'unsuspend') {
            await client.Database.Users.updateOne({ UserId: user.user.id }, { $set: { suspend: false } })

            const text = `> ✅ยกเลิกระงับบัญชี ของคุณ <@${user.user.id}> แล้ว\n> ❗หมายเหตุ : ${description ?? ''}`

            try {
                const channel = client.channels.cache.get('1088740639157538816') || await client.channels.fetch('1088740639157538816')

                if (channel?.isTextBased()) {
                    channel.send({ content: text })
                }
            } catch { }

            await user.send({ content: text })

            return interaction.reply({ content: `> ✅ ยกเลิกระงับบัญชีของ <@${user.user.id}> แล้ว\n> ❗หมายเหตุ : ${description ?? ''}` })
        }
    }
}