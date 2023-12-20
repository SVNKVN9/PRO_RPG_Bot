import { codeBlock, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { IUser } from "../../types";
import Client from "../../structure/Client";
import { NumberWithCommas } from "../../Utils/Function";

export default {
    data: [
        new SlashCommandBuilder()
        .setName('bal')
        .setDescription('เช็คยอดเงิน')
    ],

    execute: async (client: Client, interaction: CommandInteraction) => {
        const user: IUser = await client.Database.Users.findOne({ UserId: interaction.user.id }) as any

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle('💰จำนวนเงินทั้งหมดของท่าน')
                .setTimestamp()
                .setDescription(codeBlock('fix', `${NumberWithCommas(user.cash)} แกน`))
            ],
            ephemeral: true
        })
    }
}