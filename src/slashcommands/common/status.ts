import { CommandInteraction, SlashCommandBuilder } from "discord.js"
import Client from "../../structure/Client"
import { StatusEmbed, StatusSelectMenu } from "../../handlers/Status/Rander"
import { IUser } from "../../types"

export default {
    data: [
        new SlashCommandBuilder()
        .setName('status')
        .setDescription('status')
    ],

    execute: async (client: Client, interaction: CommandInteraction) => {
        let UserId = interaction.member?.user.id as string || interaction.user.id

        const { HGD, HGF } = await client.Utils.UpdateHG(UserId)
        const User = await client.Database.Users.findOne({ UserId }) as any as IUser
        
        let Embed = await StatusEmbed(client, User, HGD, HGF)

        return interaction.reply({ embeds: [Embed], components: [StatusSelectMenu(UserId)], ephemeral: true })
    }
}