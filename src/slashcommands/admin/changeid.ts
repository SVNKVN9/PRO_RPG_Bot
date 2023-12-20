import { CommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js"
import Client from '../../structure/Client'

export default {
    data: [
        new SlashCommandBuilder()
            .setName('changeid')
            .setDescription('ย้ายไอดีผู้เล่น')
            .addUserOption(option => option.setName('oldid').setDescription('ไอดีเก่า').setRequired(true))
            .addUserOption(option => option.setName('newid').setDescription('ไอดีใหม่').setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    ],

    execute: async (client: Client, interaction: CommandInteraction) => {
        await interaction.deferReply()

        if (!client.config.OnwerIds.includes(interaction.user.id)) return interaction.editReply({ content: 'คุณไม่มีสิทธิในการใช้คำสั่งนี้' })

        const oldUser = interaction.options.getUser('oldid')
        const newUser = interaction.options.getUser('newid')

        try {
            if (oldUser?.id == newUser?.id) return interaction.editReply({ content: 'ไอดีเก่าและไอดีใหม่ต้องไม่เหมือนกัน' })

            const UserOld = await client.Database.Users.findOne({ UserId: oldUser?.id })
            const UserNew = await client.Database.Users.findOne({ UserId: newUser?.id })

            if (!UserOld) return interaction.editReply({ content: 'ไม่พบผู้ใช้' })
            if (!UserNew) return interaction.editReply({ content: 'ไม่พบผู้ใช้' })

            const filter = { UserId: oldUser?.id }
            const query = { $set: { UserId: newUser?.id } }

            await client.Database.Users.deleteOne({ UserId: newUser?.id })

            await client.Database.Users.updateOne(filter, query)
            await client.Database.Inventorys.updateMany(filter, query)
            await client.Database.Equips.updateMany(filter, query)

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`✅ย้าย ID เสร็จสิ้น`)
                        .setDescription(`
                            **จากสมาชิก** <@${oldUser?.id}>
                            ID เก่า \`${oldUser?.id}\`\n
                            ย้ายมาเป็น <@${newUser?.id}>
                            ID ใหม่ \`${newUser?.id}\`
                        `)
                ]
            })
        } catch (err) {
            interaction.editReply({ content: `${err}` })
        }
    }
}