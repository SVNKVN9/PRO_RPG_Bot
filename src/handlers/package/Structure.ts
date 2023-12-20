import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export default new SlashCommandBuilder()
    .setName('package')
    .setDescription('package')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(command => command
        .setName('starter')
        .setDescription('starter')
        .addUserOption(option => option
            .setName('user')
            .setDescription('ผู้ใช้')
            .setRequired(true)
        )
    )