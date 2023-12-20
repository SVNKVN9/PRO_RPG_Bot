import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";
import path from 'path'

export default {
    data: [
        new SlashCommandBuilder()
        .setName('birth_point')
        .setDescription('เซฟจุดเกิด')
        .addStringOption(option => option
            .setName('name')
            .setDescription('ชื่อจุดเกิด')
            .setRequired(true)
        )
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('channel')
            .setRequired(true)
        )
        .addRoleOption(option => option
            .setName('role')
            .setDescription('role')
        )
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        const name = interaction.options.get('name')?.value
        const channel = interaction.options.get('channel')?.channel
        const role = interaction.options.get('role')?.role

       if (!client.config.OnwerIds.includes(interaction.user.id)) return interaction.reply({ ephemeral: true, content: 'คุณไม่มีสิทธิในการใช้คำสั่งนี้' }) 

        const birthpoint = await client.Database.BirthPoint.insertOne({
            name,
            guildId: interaction.guild?.id,
            channelId: channel?.id,
            roleId: role?.id
        })

        await interaction.reply({ ephemeral: true, embeds: [new EmbedBuilder().setDescription(`✅ สร้าง birth-point สำเร็จ`).setColor('Green')] })

        return interaction.channel?.send({
            embeds: [
                new EmbedBuilder()
                .setTitle(`📍จุดเกิด ${name}`)
                .setDescription(`**บทบาทที่ได้**: ${role?.id ? `<@&${role?.id}>` : ''} `)
                .setImage('attachment://BirthPoint.png')
            ],
            files: [
                new AttachmentBuilder('./image/BirthPoint.png')
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                    .setLabel(`📍เซฟจุดเกิด📍`)
                    .setStyle(ButtonStyle.Success)
                    .setCustomId(`birthpoint-${birthpoint.insertedId}`)
                )
            ]
        })
    }
}