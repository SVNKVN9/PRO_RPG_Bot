import { SimpleVoice, InviteVoice, VoiceType } from "../../types";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import Client from "../../structure/Client";

const awaitComponent = async (client: Client, pageNo: number, voiceDetail: { text: string[], selection: StringSelectMenuBuilder }[], interaction: CommandInteraction): Promise<any> => {
    const MessageDelete = await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setDescription(voiceDetail[pageNo].text.join('\n'))
        ],
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(voiceDetail[pageNo].selection),
            
            new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                .setLabel(`ย้อนกลับ`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pageNo == 0)
                .setCustomId(`${pageNo - 1}`),

                new ButtonBuilder()
                .setLabel(`ถัดไป`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pageNo == (voiceDetail.length - 1))
                .setCustomId(`${pageNo + 1}`)
            )
        ]
    })

    const SelectDelete = await MessageDelete.awaitMessageComponent({
        filter: (action) => action.user.id == interaction.user.id,
        time: 30_000
    }).catch(() => {
        interaction.editReply({ components: [] })
    })

    if (!SelectDelete) return

    if (SelectDelete.isButton()) {
        await SelectDelete.deferUpdate()

        return awaitComponent(client, parseInt(SelectDelete.customId), voiceDetail, interaction)
    }

    if (!SelectDelete.isStringSelectMenu()) return

    await SelectDelete.deferUpdate()

    const MessageConfirm = await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setDescription(`ยื่นยันการลบ \`${SelectDelete.values[0]}\``)
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(`ยืนยัน`)
                        .setStyle(ButtonStyle.Success)
                        .setCustomId(`confirm`),

                    new ButtonBuilder()
                        .setLabel(`ยกเลิก`)
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId(`cancel`)
                )
        ]
    })

    const DeleteConfirm = await MessageConfirm.awaitMessageComponent({
        filter: (action) => action.user.id == interaction.user.id,
        time: 30_000
    }).catch(() => {
        interaction.editReply({ components: [] })
    })

    if (!DeleteConfirm) return

    if (!DeleteConfirm.isButton()) return

    await DeleteConfirm.deferUpdate()

    if (DeleteConfirm.customId == 'cancel') return interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setDescription(`❌ ยกเลิกการลบ voice channel`)
        ],
        components: []
    })

    await client.Database.RoleVoice.deleteOne({ ActionId: SelectDelete.values[0] })

    return interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setDescription(`✅ ลบ voice channel สำเร็จ`)
        ],
        components: []
    })
}

export default async (client: Client, interaction: CommandInteraction) => {
    const { options } = interaction

    await interaction.deferReply()

    // let guildId = options.get('guildid')?.value as string

    // if (!guildId) guildId = interaction.guildId as string

    // if (!client.guilds.cache.has(guildId)) guildId = interaction.guildId as string

    const channel = options.get('channel')?.channel

    const data = await client.Database.RoleVoice.find({
        guildId: interaction.guildId,
        channelId: channel?.id
    }).toArray() as any as SimpleVoice[] | InviteVoice[]

    // const MainText = []
    // const ChannelIds: string[] = []
    // const Mainselect = new StringSelectMenuBuilder()
    //     .setCustomId('select-voice')
    //     .setMaxValues(1)
    //     .setPlaceholder('เลือก voice ที่ต้องการเปิด')

    // for (let i in data) {
    //     const channelId = data[i].channelId

    //     if (ChannelIds.includes(channelId)) continue

    //     ChannelIds.push(channelId)

    //     try {
    //         const channel = await interaction.guild?.channels.fetch(channelId) as GuildBasedChannel

    //         MainText.push(`${parseInt(i) + 1}. <#${channelId}>`)
    //         Mainselect.addOptions({
    //             label: `${parseInt(i) + 1}. ${channel?.name}`,
    //             value: `${channelId}`
    //         })
    //     } catch (err) {
    //         MainText.push(`${parseInt(i) + 1}. Erorr Channel ${channelId}`)
    //         Mainselect.addOptions({
    //             label: `${parseInt(i) + 1}. Error Channel ${channelId}`,
    //             value: `${parseInt(i) + 1}. Error`
    //         })
    //     }
    // }

    // const message = await interaction.reply({
    //     embeds: [
    //         new EmbedBuilder()
    //             .setTitle(`Connection Info (${client.guilds.cache.get(guildId)?.name})`)
    //             .setDescription(MainText.length ? MainText.join('\n') : 'ไม่พบ Voice Connection')
    //     ],
    //     components: Mainselect.options.length != 0 ?
    //         [
    //             new ActionRowBuilder<StringSelectMenuBuilder>()
    //                 .addComponents(Mainselect)
    //         ] : []
    // })

    // const msg = await message.awaitMessageComponent({
    //     filter: (action) => action.user.id == interaction.user.id,
    //     time: 30_000
    // }).catch(() => {
    //     interaction.editReply({ components: [] })
    // })

    // if (!msg) return

    // if (!msg.isStringSelectMenu()) return

    // await msg.deferUpdate()

    // const actions = await client.Database.RoleVoice.find({ channelId: msg.values[0] }).toArray() as any as SimpleVoice[] | InviteVoice[]

    const voiceDetail: { text: string[], selection: StringSelectMenuBuilder }[] = []

    for (let i in data) {
        if (parseInt(i) % 5 == 0) voiceDetail.push({
            text: [],
            selection: new StringSelectMenuBuilder()
                .setPlaceholder(`เลือก voice channel ที่ต้องการลบ`)
                .setCustomId(`delete-voice`)
                .setMaxValues(1)
        })

        const action = data[i]

        voiceDetail[voiceDetail.length - 1].selection.addOptions({
            label: `${parseInt(i) + 1}. ${action.ActionId}`,
            value: `${action.ActionId}`
        })

        if (action.VoiceType == VoiceType.Simple) {
            let mode = ''

            if (action.giveId && !action.takeId) mode = '✅ assign-role'
            if (!action.giveId && action.takeId) mode = '🅾 remove-role'
            if (action.giveId && action.takeId) mode = '🔀 toggle-role'

            const text = []

            text.push(`┍ **${parseInt(i) + 1}. ${mode} \`${action.ActionId}\`**`)
            text.push(`┣ give role : ${action.giveId ? `<@&${action.giveId}>` : ''}`)
            text.push(`┣ take role : ${action.takeId ? `<@&${action.takeId}>` : ''}`)
            text.push(`┣ time delay : ${isNaN(action.delay as number) ? 0 : action.delay} s`)
            text.push(`┣ level required : ${action.level ?? ''}`)
            text.push(`┣ role required : ${action.roleId ? `<@&${action.roleId}>` : ''}`)
            text.push(`┣ item required : ${action.itemId ?? ''}`)
            text.push(`┣ permanent : ${action.permanent == 'permanent' ? 'ถาวร' : 'ชั่วคราว'}`)
            text.push(`╰────────────────────────────────────`)

            voiceDetail[voiceDetail.length - 1].text = voiceDetail[voiceDetail.length - 1].text.concat(text)
        }

        if (action.VoiceType == VoiceType.Invite) {
            try {
                const channel = client.channels.cache.get(action.channelInvite) || await client.channels.fetch(action.channelInvite) as any

                const guildName = channel.guild.name
                const channelName = channel.name

                if (!guildName) continue
                if (!channelName) continue

                const toGuild = client.guilds.cache.get(channel.guildId)

                const text = []

                text.push(`┍ **${parseInt(i) + 1}. \`${action.ActionId}\`**`)
                text.push(`┣ to server : **${guildName}**`)
                text.push(`┣ to channel : **${channelName}**`)
                text.push(`┣ give role : **@${toGuild?.roles.cache.get(action.giveId ?? '')?.name ?? ''}**`)
                text.push(`╰────────────────────────────────────`)

                voiceDetail[voiceDetail.length - 1].text = voiceDetail[voiceDetail.length - 1].text.concat(text)
            } catch { }
        }
    }

    return awaitComponent(client, 0, voiceDetail, interaction)
}