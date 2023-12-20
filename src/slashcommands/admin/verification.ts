import { CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('verification')
            .setDescription('ยืนยันตัวตน')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addUserOption(option => option
                .setName('user')
                .setDescription('ผู้ใช้')
                .setRequired(true)
            )
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        const User = interaction.options.getUser('user')
        
        await client.Database.Users.updateOne({ UserId: User?.id }, { $set: { verification: true } })

        return interaction.reply({ content: `✅ <@${User?.id}> ยืนยันตัวตนสำเร็จ` })
    }
}