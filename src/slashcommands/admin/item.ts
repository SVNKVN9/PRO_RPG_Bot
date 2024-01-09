import { Colors, CommandInteraction, EmbedBuilder, GuildMember, RoleSelectMenuBuilder, SlashCommandBuilder, SlashCommandNumberOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandUserOption, User, codeBlock } from "discord.js"
import Client from "../../structure/Client"
import Inventory from "../../handlers/inventory/Inventory"
import give from "../../Utils/give";
import { ItemsType } from "../../types";
import take from "../../Utils/take";


const buildOption = (option: any, name: string, description: string) => option
    .setName(name)
    .setDescription(description)
    .setRequired(true);

const buildSubcommand = (subcommand: SlashCommandSubcommandBuilder, name: string) => subcommand
    .setName(name)
    .setDescription('ให้ไอเทม')
    .addStringOption(option => buildOption(option, 'item-id', 'ไอดีไอเทม'))
    .addNumberOption(option => buildOption(option, 'pieces', 'จำนวน'))
    .addUserOption(option => buildOption(option, 'user', 'เลือก user'));


export default {
    data: [
        new SlashCommandBuilder()
            .setName('item')
            .setDescription('จัดการไอเทม')
            .addSubcommand(subcommand => buildSubcommand(subcommand, 'give'))
            .addSubcommand(subcommand => buildSubcommand(subcommand, 'take'))
            .addSubcommand(subcommand => buildSubcommand(subcommand, 'use'))
            .addSubcommand(subcommand => buildSubcommand(subcommand, 'remove'))
            .addSubcommand(subcommand => buildSubcommand(subcommand, 'delete'))
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        if (!client.config.OnwerIds.includes(interaction.user.id)) return interaction.reply({ ephemeral: true, content: 'คุณไม่มีสิทธิใช้คำสั่งนี้' })

        await interaction.deferReply({ ephemeral: true })

        const { options } = interaction

        const Command = options.data[0].name
        const ItemId = options.get('item-id')?.value as string
        const Pieces = options.get('pieces')?.value as number
        const User = options.get('user')?.user as User

        if (Command === 'give') {
            const { Message } = await give(client, interaction.user.id, User.id, ItemId, Pieces)

            return interaction.editReply(Message)
        } else if (Command === 'take') {
            const { Message } = await take(client, interaction.user.id, User.id, ItemId, Pieces)

            return interaction.editReply(Message)
        } else if (Command === 'use') {

        } else if (Command === 'remove') {

        } else if (Command === 'delete') {
            
        }
    }
}