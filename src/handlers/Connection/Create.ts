import { CommandInteraction, EmbedBuilder } from "discord.js";
import Client from "../../structure/Client";
import { CreateId } from "../../Utils/Function";
import { ActionType, VoiceType } from '../../types'

const ValidParameter = async (client: Client, level: string | number | boolean | undefined, itemId: any) => {
    const errors = []

    if (level) {
        const [LevelMin, LevelMax] = level.toString().split('-').sort((a, b) => parseInt(a) - parseInt(b))

        if (
            typeof parseInt(LevelMin.trim()) != 'number' ||
            typeof parseInt(LevelMax.trim()) != 'number'
        ) errors.push('**Level Required** ข้อมูลไม่ถูกต้อง | (ขั้นต่ำ - สูงสุด) [10 - 20]')
    }

    if (itemId) {
        const isItem = await client.Database.Items(itemId)

        if (!isItem) errors.push(`**Item Required** ไม่พบไอเทมในระบบ`)
    }

    return errors
}

export const SimpleVoice = async (client: Client, interaction: CommandInteraction) => {
    const { options } = interaction

    const channel = options.get('channel')?.channel
    const permanent = options.get('permanent')?.value
    const delay = options.get('delay')?.value
    const level = options.get('level')?.value
    const role = options.get('role')?.role
    const itemId = options.get('item-id')?.value
    const description = options.get('description')?.value

    const action = options.data[0].name as ActionType

    // valid Parameter
    const errors = await ValidParameter(client, level, itemId)

    if (errors.length) return interaction.reply({ content: errors.join('\n') })

    // Create object
    const Id = CreateId(16)

    let DefaultObject = {
        ActionId: Id,
        VoiceType: VoiceType.Simple,
        guildId: interaction.guildId,
        channelId: channel?.id,
        permanent,
        delay: parseInt(delay as string),
        level,
        roleId: role?.id,
        itemId,
        description
    }

    const giveId = options.get('give-role')?.role?.id
    const takeId = options.get('take-role')?.role?.id

    if (action == 'assign-role') DefaultObject = Object.assign(DefaultObject, { giveId })
    if (action == 'remove-role') DefaultObject = Object.assign(DefaultObject, { takeId })
    if (action == 'toggle-role') DefaultObject = Object.assign(DefaultObject, { giveId, takeId })

    // Inseret into DB
    await client.Database.RoleVoice.insertOne(DefaultObject)

    return interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setTimestamp()
                .setDescription(`
            ┍  ✅ <#${channel?.id}> ${action} \`${Id}\`
            ┣ give role : ${giveId ? `<@&${giveId}> ${giveId}` : ''}
            ┣ take role : ${takeId ? `<@&${takeId}> ${takeId}` : ''}
            ┣ time delay : \`${delay ?? 0} s\`
            ┣ level required : \`${level ?? ' '}\`
            ┣ role required : ${role ? `<@&${role.id}> ${role.id}` : ''}
            ┣ item required : \`${itemId ?? ' '}\`
            ┣ permanent : ${permanent == 'permanent' ? 'ถาวร' : 'ชั่วคราว'}
            ┣ description : ${description ?? ''}
            ╰────────────────────────────────────
            `)
        ]
    })
}

export const PermissionVoice = async (client: Client, interaction: CommandInteraction) => {
    const { options } = interaction

    const channel = options.get('channel')?.channel
    const viewChannel = options.get('view-channel')?.channel
    const permanent = options.get('permanent')?.value
    const delay = options.get('delay')?.value
    const level = options.get('level')?.value
    const role = options.get('role')?.role
    const itemId = options.get('item-id')?.value
    const description = options.get('description')?.value

    const action = options.data[0].name

    // valid Parameter
    const errors = await ValidParameter(client, level, itemId)

    if (errors.length) return interaction.reply({ content: errors.join('\n') })

    // Create Object
    const Id = CreateId(16)

    let DefaultObject = {
        ActionId: Id,
        VoiceType: VoiceType.Permission,
        guildId: interaction.guildId,
        channelId: channel?.id,
        action: action.includes('on') ? 'add' : 'remove',
        viewId: viewChannel?.id,
        permanent,
        delay: parseInt(delay as string),
        level,
        roleId: role?.id,
        itemId,
        description
    }

    // Inseret into DB
    await client.Database.RoleVoice.insertOne(DefaultObject)

    return interaction.reply({ content: '✅ สร้าง voice channel สำเร็จ' })
}

export const InviteVoice = async (client: Client, interaction: CommandInteraction) => {
    const { options } = interaction

    const channel = options.get('channel')?.channel
    const channelInvite = options.get('channel-id')?.value
    const Giverole = options.get('give-role')?.value
    const delay = options.get('delay')?.value
    const level = options.get('level')?.value
    const role = options.get('role')?.role
    const itemId = options.get('item-id')?.value
    const description = options.get('description')?.value

    // Valid channel
    try {
        if (!client.channels.cache.has(channelInvite as string)) return interaction.reply({ content: `ไม่พบ channel-id ที่ต้องการสร้าง invite` })
    } catch (err) {
        return interaction.reply({ content: `**Error** Valid Parameter, ${err}` })
    }

    // valid Parameter
    const errors = await ValidParameter(client, level, itemId)

    if (errors.length) return interaction.reply({ content: errors.join('\n') })

    // Insert into DB
    const Id = CreateId(16)

    await client.Database.RoleVoice.insertOne({
        ActionId: Id,
        VoiceType: VoiceType.Invite,
        guildId: interaction.guildId,
        channelId: channel?.id,
        channelInvite: channelInvite,
        giveId: Giverole,
        delay: parseInt(delay as string),
        level,
        roleId: role?.id,
        itemId,
        description
    })

    return interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setTimestamp()
                .setDescription(`
            ┍  ✅ <#${channel?.id}> Invite \`${Id}\`
            ┣ give role : ${Giverole ?? ''}
            ┣ time delay : \`${delay ?? 0} s\`
            ┣ level required : \`${level ?? ' '}\`
            ┣ role required : ${role ? `<@&${role.id}> ${role.id}` : ''}
            ┣ item required : \`${itemId ?? ' '}\`
            ┣ description : ${description ?? ''}
            ╰────────────────────────────────────
            `)
        ]
    })
}