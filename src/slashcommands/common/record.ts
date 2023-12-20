import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { IUptimeLog, LogAction } from '../../types'
import Client from "../../structure/Client";
import { msToDHM, NumberWithCommas, ThaiZone } from "../../Utils/Function";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('record')
            .setDescription('record')
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        await interaction.deferReply({ ephemeral: true })
        
        const logs: IUptimeLog[] = await (await client.Database.Uptime.find({ UserId: interaction.user.id }).sort({ _id: -1 }).limit(10).toArray() as any[]).reverse()

        const Description: string[] = []

        for (let i = 0; i < logs.length; i++) {
            const { Action, Timestramp, Time, EXP } = logs[i]
            const P_log = logs[i - 1]

            const changeTime = msToDHM(Time - (P_log ? P_log.Time : 0)).split(" ").filter(value => parseInt(value) != 0).join(" ")

            Description.push(`${Action == LogAction.Join ? '🟢' : '🟤'} ${ThaiZone(Timestramp)} ⌚\`+${changeTime != '' ? changeTime : '0m'}\` (${msToDHM(Time)}) ✨EXP = \`${NumberWithCommas(EXP)}\``)
        }

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('🚶🏻‍♂️ ประวัติเวลาการเข้าห้อง')
                    .setDescription(Description.length ? Description.join('\n') : "**Not Found**")
            ],
        })
    }
}