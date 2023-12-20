import { Colors, CommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Client from "../../structure/Client";
import give from '../../Utils/give'
import { ItemsType } from "../../types";

type condition = 'onheadphone-onmic' | 'onheadphone-offmic' | 'everyone'

export default {
    data: [
        new SlashCommandBuilder()
            .setName('give')
            .setDescription('ให้ไอเทม')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addSubcommand(subcommand => subcommand
                .setName('all')
                .setDescription('ทั้งหมด')
                .addStringOption(option => option
                    .setName('item-id')
                    .setDescription('ไอดีไอเทม')
                    .setRequired(true)
                )
                .addIntegerOption(option => option
                    .setName('quantity')
                    .setDescription('จำนวน')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('condition')
                    .setDescription('เงื่อนไข')
                    .addChoices(
                        {
                            name: 'เปิดหูฟัง เปิดไมค์',
                            value: 'onheadphone-onmic'
                        },
                        {
                            name: 'เปิดหูฟัง ปิดไมค์',
                            value: 'onheadphone-offmic'
                        },
                        {
                            name: 'ได้ทั้งหมดที่อยู่ในห้อง ',
                            value: 'everyone'
                        }
                    )
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('description')
                    .setDescription('หมายเหตุ')
                )
            )
    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        if (!client.config.OnwerIds.includes(interaction.user.id)) return interaction.reply({ ephemeral: true, content: '**คุณไม่มีสิทธิในการใช้คำสั่งนี้**' })

        const ItemId = interaction.options.get('item-id')?.value as string
        const quantity = parseInt(interaction.options.get('quantity')?.value as string) as number
        const condition = interaction.options.get('condition')?.value as condition
        const description = interaction.options.get('description')?.value

        const Member = interaction.guild?.members.cache.get(interaction.user.id)

        if (!Member?.voice.channel) return interaction.reply({ ephemeral: true, content: '**คุณไม่ได้อยู่ในห้องเสียง**' })

        await interaction.deferReply()

        let members = Member.voice.channel?.members.toJSON().map((member) => member.voice)

        if (condition == 'onheadphone-onmic') members = members.filter((voice) => !voice.selfDeaf && !voice.selfMute)
        else if (condition == 'onheadphone-offmic') members = members.filter((voice) => !voice.selfDeaf && voice.selfMute)

        let UserIds = members.map(voice => voice.id).filter((UserId) => UserId != interaction.user.id)

        await give(client, null, UserIds, ItemId, quantity)

        const Item = await client.Database.Items(ItemId) as ItemsType

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`🎁 <@${interaction.user.id}> ให้ไอเทมกับคนที่อยู่ในห้อง <#${Member.voice.channel.id}> สำเร็จ ✅`)
                    .addFields(
                        {
                            name: '❕ เงื่อนไข',
                            value: `\`${condition == 'onheadphone-onmic' ? 'เปิดหูฟัง เปิดไมค์' : condition == 'onheadphone-offmic' ? 'เปิดหูฟัง ปิดไมค์' : 'ได้ทั้งหมดที่อยู่ในห้อง'}\``
                        },
                        {
                            name: '🎁 ไอเทมที่ได้',
                            value: `${Item.Base.ItemId}${Item.Base.EmojiId ?? ''}${Item.Base.ItemName} \`(จำนวน ${quantity})\``
                        },
                        {
                            name: '😊 ผู้ที่ได้ไอเทม',
                            value: `${UserIds.map(UserId => `<@${UserId}>`).join('\n')}`
                        },
                        {
                            name: '❗ หมายเหตุ',
                            value: `${description ?? '\u200B'}`
                        }
                    )
                    .setColor(Colors.White)
                    .setTimestamp()
            ]
        })
    }
}