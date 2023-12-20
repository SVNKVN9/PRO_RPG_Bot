import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";
import { NumberWithCommas } from "../../Utils/Function";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('money')
            .setDescription('เพิ่มเงิน / ลบเงิน')
            .addUserOption(option => option.setName('ผู้เล่น').setDescription('ระบุผู้เล่น').setRequired(true))
            .addNumberOption(option => option.setName('จำนวน').setDescription('ระบุจำนวนที่ต้องการขาย').setRequired(true)),
    ],

    execute: async (client: Client, interaction: CommandInteraction) => {
        if (!client.config.OnwerIds.includes(interaction.user.id)) return interaction.reply({ content: 'คุณไม่มีสิทธใช้คำสั่งนี้', ephemeral: true })

        const [target, amount] = interaction.options.data

        await client.Database.Users.updateOne({ UserId: target.user?.id }, { $inc: { cash: parseInt(amount.value as string) } })

        if (parseInt(amount.value as string) > 0) {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`🟢 แก้ไขเงินของ <@${interaction.user.id}> เพิ่มเงินให้กับ <@${target.user?.id}> สำเร็จ ✅ \n\n **💰จำนวน** \n \`\`\` +${NumberWithCommas(parseInt(amount.value as string))} แกน\`\`\``)
                        .setColor('Green')
                        .setTimestamp()
                ]
            })
        } else {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`🔴 แก้ไขเงินของ <@${interaction.user.id}> ลบเงินออกจาก <@${target.user?.id}> สำเร็จ ✅ \n\n **💰จำนวน** \n \`\`\` ${NumberWithCommas(parseInt(amount.value as string))} แกน\`\`\``)
                        .setColor('Red')
                        .setTimestamp()
                ]
            })
        }

    }
}