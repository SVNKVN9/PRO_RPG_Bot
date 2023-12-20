import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js'
import fs from 'fs'
import Client from '../structure/Client'
import { Delay } from './Function';

const shuffle = (array: string[]): string[] => {
    let currentIndex = array.length, randomIndex;

    while (currentIndex != 0) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

export const Captcha = async (client: Client, interaction: ButtonInteraction): Promise<boolean> => {

    const Captchas = fs.readdirSync('./captcha')

    const RandomCaptcha = () => Captchas[Math.floor(Math.random() * Captchas.length)]

    const Currect = RandomCaptcha()

    const ChoichList = shuffle([
        Currect.split('.')[0],
        RandomCaptcha().split('.')[0],
        RandomCaptcha().split('.')[0],
        RandomCaptcha().split('.')[0],
        RandomCaptcha().split('.')[0]
    ])

    const MessageOption = {
        files: [`./captcha/${Currect}`],
        ephemeral: true,

        content: `⌛ <t:${Math.round((Date.now() / 1000) + 30)}:R>`,

        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(ChoichList[0])
                        .setLabel(ChoichList[0])
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId(ChoichList[1])
                        .setLabel(ChoichList[1])
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId(ChoichList[2])
                        .setLabel(ChoichList[2])
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId(ChoichList[3])
                        .setLabel(ChoichList[3])
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId(ChoichList[4])
                        .setLabel(ChoichList[4])
                        .setStyle(ButtonStyle.Success),
                )
        ]
    }

    if (interaction.replied) {
        await interaction.editReply(MessageOption)
    } else {
        await interaction.reply(MessageOption)
    }

    try {
        const collector = await interaction.channel?.awaitMessageComponent({ filter: (i) => i.user.id == interaction.user.id, time: 30_000 })

        await collector?.deferUpdate()

        if (collector?.customId != Currect.split('.')[0]) {
            await interaction.editReply({ content: `❌ กรุณาลองใหม่ ⌛ <t:${Math.round((Date.now() / 1000) + 3)}:R>`, components: [] })

            await Delay(3000)

            return false
        }

        await interaction.deleteReply()

        return true
    } catch {
        await interaction.editReply({ content: `❌ หมดเวลาการยืนยัน $⌛ <t:${Math.round((Date.now() / 1000) + 3)}:R>`, components: [] })

        await Delay(3000)

        return false
    }
}