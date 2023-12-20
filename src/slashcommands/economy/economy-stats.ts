import { codeBlock, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";
import { NumberWithCommas } from "../../Utils/Function";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('economy-stats')
            .setDescription('ดูผลสรุปทางเศรษฐกิจทั้งหมด')
    ],

    execute: async (client: Client, interaction: CommandInteraction) => {

        const DayMs = 86_400_000

        const now = Date.now()

        const date =  new Date()
        const day = date.getDate()
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        
        const CTP_Time = [
            now, // now
            now - DayMs, // 1 day ago
            now - (DayMs * 2), // 2 day ago
            now - (DayMs * 3), // 3 day ago
            now - (DayMs * 4)
        ]
        const CTF_Time = [
            now - (DayMs * 30),
            now - (DayMs * 31),
            now - (DayMs * 32),
            now - (DayMs * 33),
            now - (DayMs * 34)
        ]

        const data = await client.Database.Backup.find({}).toArray() as any[]

        const CTPs = []
        const CTFs = []

        for (let CTP of CTP_Time) {
            const date = new Date(CTP)
            const day = date.getDate()
            const month = date.getMonth() + 1
            const year = date.getFullYear()

            CTPs.push(data.find((value) => value.FullDate == `${day}-${month}-${year}`)['0'])
        }

        for (let CTF of CTF_Time) {
            const date = new Date(CTF)
            const day = date.getDate()
            const month = date.getMonth() + 1
            const year = date.getFullYear()

            CTFs.push(data.find((value) => value.FullDate == `${day}-${month}-${year}`)['0'])
        }

        const CTP = CTPs.reduce((p, c) => p + c, 0) / 5
        const CTF = CTFs.reduce((p, c) => p + c, 0) / 5

        const Inf = (100 / CTF) * (CTP - CTF)

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle('📊สถิติทางเศรษฐกิจ')
                .addFields([
                    {
                        name: '💰เงินทั้งหมดในระบบ',
                        value: codeBlock('cpp', `${NumberWithCommas(CTPs[0])} แกน`)
                    },
                    {
                        name: '📈อัตตราเงินเฟ้อ',
                        value: `1 เดือน\n${codeBlock('diff', Inf > 0 ? `+${Inf.toFixed(2)} %`: `${Inf.toFixed(2)} %`)}`
                    }
                ])
                .setTimestamp()
            ]
        })
    }
}
