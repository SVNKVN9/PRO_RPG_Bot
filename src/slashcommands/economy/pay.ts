import { codeBlock, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { IUser } from "../../types";
import Client from "../../structure/Client";
import { ErrorEmbeds } from "../../Utils/Components";
import { isDecimal, NumberWithCommas } from "../../Utils/Function";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('pay')
            .setDescription('โอนเงินให้ผู้เล่นอื่น')
            .addUserOption(option => option.setName('ผู้รับ').setDescription('ผู้รับ').setRequired(true))
            .addNumberOption(option => option.setName('จำนวนเงิน').setDescription('จำนวนเงิน').setRequired(true).setMinValue(1))
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        const target = interaction.options.get('ผู้รับ') as any
        const amount = interaction.options.get('จำนวนเงิน') as any

        await interaction.deferReply({ ephemeral: true })

        if (!isDecimal(parseFloat(amount.value as string))) return interaction.editReply({ embeds: [ErrorEmbeds.InvalidNumber()] })

        if (interaction.user.id == target.user?.id) return interaction.editReply({ embeds: [ErrorEmbeds.ActionSelf()] })

        const user: IUser = await client.Database.Users.findOne({ UserId: interaction.member?.user.id }) as any
        const Target: IUser = await client.Database.Users.findOne({ UserId: target.user?.id }) as any

        if (Target.suspend) {
            await interaction.deleteReply()

            return interaction.channel?.send({ content: `<@${target.user?.id}> โดนอายัดบัญชี` })
        }

        if (user.cash < (amount.value as number)) return interaction.editReply({ embeds: [ErrorEmbeds.NotCash()] })

        await interaction.deleteReply()

        await client.Database.Users.updateOne({ UserId: interaction.user.id }, { $inc: { cash: -(amount.value as number) } })
        await client.Database.Users.updateOne({ UserId: target.user?.id }, { $inc: { cash: amount.value } })

        return interaction.channel?.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('✅การโอนเงินสำเร็จ💰')
                    .setDescription(`⬇ ผู้โอน <@${interaction.user.id}>\nจำนวนเงิน ${codeBlock('fix', `${NumberWithCommas(amount.value)} แกน`)}💰 ผู้รับ <@${target.user?.id}>`)
                    .setColor('Yellow')
                    .setTimestamp()
            ]
        })
    }
}