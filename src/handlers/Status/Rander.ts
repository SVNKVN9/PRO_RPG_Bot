import { ButtonInteraction, EmbedBuilder, StringSelectMenuInteraction, codeBlock, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { BirthPoint, ICooldown, ILevel, ItemEquip, ItemsType, IUser, Passive, TypeAB, TypeB, TypeP, TypePA, TypePD } from '../../types'
import Client from "../../structure/Client";
import { PrograssBar, minToTime } from "../../Utils/Function";
import { ObjectID } from "bson";
import Pages from "./Pages";

export const StatusEmbed = async (client: Client, User: IUser, HGD: number, HGF: number) => {
    const BirthPoint = await client.Database.BirthPoint.findOne({ _id: new ObjectID(User.birthpoint) }) as any as BirthPoint

    return new EmbedBuilder()
        .setDescription(`📍**จุดเกิด** ${BirthPoint ? BirthPoint.name : ''}`)
        .addFields(
            {
                name: 'Status',
                value: `${codeBlock('js', `🩺สุขภาพ HEA ${PrograssBar(User.stats.HEA.value)}${User.stats.HEA.value}%`)}${codeBlock('js', `🍱ความหิวอาหาร    HGF : ${minToTime(HGD)} ${HGD  == 0 ? '🔴' : '🟢'}\n🍹ความหิวเครื่องดื่ม  HGD : ${minToTime(HGF)} ${HGF  == 0 ? '🔴' : '🟢'}`)}`
            },
            {
                name: '📑 สเตตัสทั้งหมด',
                value: codeBlock('cpp', `
1.  🧘🏻‍♂️ การบ่มเพาะพลัง
2.  ⚠️ สถานติดตัว
3.  🥋 พลังการต่อสู้ 
4.  ☄️ วิชายุทธ์
5.  🐉 ร่างแปลง
6.  👘 ไอเทมสวมใส่ภายนอก
7.  👚 ไอเทมสวมใส่ภายใน
8.  🛠️ ทักษะความสามารถ
9.  🧬 อัตลักษณ์`)
            })
}

export const StatusSelectMenu = (UserId: string) => new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('SelectStats')
            .setPlaceholder('เลือกข้อมูลที่ท่านต้องการเปิด')
            .addOptions(
                {
                    label: '1. 🧘🏻‍♂️ การบ่มเพาะพลัง',
                    value: `1-${UserId}`,
                },
                {
                    label: '2. ⚠️ สถานติดตัว',
                    value: `2-${UserId}`,
                },
                {
                    label: '3. 🥋 พลังการต่อสู้ ',
                    value: `31-${UserId}`,
                },
                {
                    label: '4. ☄️ วิชายุทธ์',
                    value: `4-${UserId}`,
                },
                {
                    label: '5. 🐉 ร่างแปลง',
                    value: `5-${UserId}`,
                },
                {
                    label: '6. 👘 ไอเทมสวมใส่ภายนอก',
                    value: `6-${UserId}`,
                },
                {
                    label: '7. 👚 ไอเทมสวมใส่ภายใน',
                    value: `7-${UserId}`,
                },
                {
                    label: '8. 🛠️ ทักษะความสามารถ',
                    value: `8-${UserId}`,
                },
                {
                    label: '9. 🧬 อัตลักษณ์',
                    value: `9-${UserId}`,
                },
            )
    )

export const SecondRow = (UserId: string) => new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setCustomId(`ButtonStats-${UserId}`)
            .setLabel('กลับหน้าหลัก')
            .setStyle(ButtonStyle.Success)
    )

export const ButtonStats = async (client: Client, interaction: ButtonInteraction) => {
    const [index, userId] = interaction.customId.split('-')

    const { HGD, HGF } = await client.Utils.UpdateHG(userId)
    const User = await client.Database.Users.findOne({ UserId: userId }) as any as IUser

    const Embed = await StatusEmbed(client, User, HGD, HGF)

    if (!interaction.message.interaction) {
        interaction.deferUpdate()
        interaction.message.edit({ embeds: [Embed], components: [StatusSelectMenu(userId)] })
    }
    else interaction.update({ embeds: [Embed], components: [StatusSelectMenu(userId)] })
}

export const SelectStats = async (client: Client, interaction: StringSelectMenuInteraction) => {
    const [index, userId] = interaction.values[0].split('-')

    if (userId != interaction.user.id && !client.config.OnwerIds.includes(interaction.user.id)) return interaction.reply({ ephemeral: true, content: "คุณไม่สามารถเช็คข้อมูลของคนอื่นได้" })

    const User = await client.Database.Users.findOne({ UserId: userId }) as IUser
    const Level: ILevel = await client.Database.Level.findOne({ LevelNo: User.stats.level.toString() }) as any

    const Equips: ItemEquip[] = await client.Database.Equips.find({ UserId: userId }).toArray() as any
    const Cooldowns = await client.Database.CooldownUse.find({ UserId: userId }).toArray() as any as ICooldown[]

    const Page = new Pages(User, Level, Equips, Cooldowns, client, interaction, parseInt(index))

    const message = await Page.Render()

    if (!interaction.message.interaction) {
        interaction.deferUpdate()
        interaction.message.edit(message)
    }
    else interaction.update(message)
}