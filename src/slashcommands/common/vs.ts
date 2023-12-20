import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";
import { Versus } from "../../handlers/versus";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('vs')
            .setDescription(`หน้าต่างการต่อสุ้`)
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        return interaction.reply({ content: '**ยังไม่พร้อมใช้งาน**', ephemeral: true })

        // const Member = await interaction.guild?.members.fetch(interaction.user.id)

        // await interaction.deferReply({ ephemeral: true })

        // if (!Member?.voice.channel) return interaction.editReply({ content: `**คุณไม่ได้อยู่ในห้องเสียง**` })

        // const versus = new Versus(client, interaction, Member.voice.channelId as string)

        // return versus.start()
    }
}
