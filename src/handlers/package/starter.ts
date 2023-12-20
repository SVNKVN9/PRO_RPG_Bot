import { CommandInteraction, EmbedBuilder, TextBasedChannel, codeBlock } from "discord.js";
import Client from "../../structure/Client";
import { ILevel, IUser } from "../../types";
import { LevelFunction } from "../Level/LevelMsg";
import { NumberWithCommas } from "../../Utils/Function";

export default async (client: Client, interaction: CommandInteraction) => {
    const user = interaction.options.getUser('user')
    const User = await client.Database.Users.findOne({ UserId: user?.id }) as any as IUser

    await interaction.deferReply()

    if (User.stats.level >= 1) return interaction.editReply({ content: '❌ ผู้เล่นมีเลเวลมากกว่า 1' })

    const EXP = User.stats.exp

    const LevelNo = ['0.2', '0.4', '0.7', '1']

    if (EXP >= 25) LevelNo.splice(LevelNo.indexOf('0.2'), 1)
    if (EXP >= 50) LevelNo.splice(LevelNo.indexOf('0.4'), 1)
    if (EXP >= 75) LevelNo.splice(LevelNo.indexOf('0.7'), 1)
    
    const levels = await Promise.all(LevelNo.map(async LevelNo => await client.Database.Level.findOne({ LevelNo }))) as any as ILevel[]

    await client.Database.Users.updateOne({ UserId: user?.id }, {
        $set: {
            'stats.exp': 101,
            'stats.level': 1,
            'stats.LevelMax': 1
        },
        $inc: {
            cash: 2000000
        }
    })

    const message = {
        embeds: [
            new EmbedBuilder()
                .setDescription(`💰 จำนวน ${codeBlock('diff', `+${NumberWithCommas(2000000)} แกน`)}`)
                .setColor('Green')
                .setTimestamp()
        ]
    }

    try {
        const channel = client.channels.cache.find(channel => channel.id == '1055105249867726868') as TextBasedChannel || await client.channels.fetch('1055105249867726868') as TextBasedChannel

        await channel.send(message)
    } catch { }

    try {
        user?.send(message)
    } catch { }

    for (let level of levels) {
        const { ItemRandom, ItemSelect, ItemReward, } = await LevelFunction(client, User, Infinity, level)

        if (level.RandomCount && level.RandomCount.length > 0) {
            await ItemRandom()
        }

        if (level.ItemSelect && level.ItemSelect.length > 0) {
            await ItemSelect()
        }

        if (level.ItemReward && level.ItemReward.length > 0) {
            await ItemReward()
        }
    }

    return interaction.editReply({ content: `✅ <@${interaction.user.id}> ให้แพ็คเกจเติบโตผู้เล่นใหม่ กับ <@${user?.id}> สำเร็จ ` })
}