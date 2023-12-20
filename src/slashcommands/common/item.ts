import { CommandInteraction, GuildMember, MessageCreateOptions, SlashCommandBuilder, ChannelType } from "discord.js";
// import { Command, ICasting, ItemBase, ItemParameter, StatusType } from '../../types'
import Client from "../../structure/Client";
import { ErrorEmbeds } from "../../Utils/Components";

export default {
    data: [
        new SlashCommandBuilder()
            .setName('use')
            .setDescription('use')
            .addStringOption(option => option.setName('ไอเทมไอดี').setDescription('ระบุไอเทมไอดีที่ต้องการใช้').setRequired(true)),

        new SlashCommandBuilder()
            .setName('ulti')
            .setDescription('ulti')
            .addStringOption(option => option.setName('ไอเทมไอดี').setDescription('ระบุไอเทมไอดีที่ต้องการใช้').setRequired(true)),

        new SlashCommandBuilder()
            .setName('eat')
            .setDescription('eat')
            .addStringOption(option => option.setName('ไอเทมไอดี').setDescription('ระบุไอเทมไอดีที่ต้องการใช้').setRequired(true)),

        new SlashCommandBuilder()
            .setName('drink')
            .setDescription('drink')
            .addStringOption(option => option.setName('ไอเทมไอดี').setDescription('ระบุไอเทมไอดีที่ต้องการใช้').setRequired(true)),

        new SlashCommandBuilder()
            .setName('ass')
            .setDescription('ass')
            .addStringOption(option => option.setName('ไอเทมไอดี').setDescription('ระบุไอเทมไอดีที่ต้องการใช้').setRequired(true))
            .addUserOption(option => option.setName('เป้าหมาย').setDescription('ระบุเป้าหมาย').setRequired(true)),

        new SlashCommandBuilder()
            .setName('sup')
            .setDescription('sup')
            .addStringOption(option => option.setName('ไอเทมไอดี').setDescription('ระบุไอเทมไอดีที่ต้องการใช้').setRequired(true))
            .addUserOption(option => option.setName('เป้าหมาย').setDescription('ระบุเป้าหมาย').setRequired(true)),

        new SlashCommandBuilder()
            .setName('att')
            .setDescription('att')
            .addStringOption(option => option.setName('ไอเทมไอดี').setDescription('ระบุไอเทมไอดีที่ต้องการใช้').setRequired(true))
            .addUserOption(option => option.setName('เป้าหมาย').setDescription('ระบุเป้าหมาย').setRequired(true)),
            

    ],
    execute: async (client: Client, interaction: CommandInteraction) => {
        await interaction.deferReply({ ephemeral: true })

        if (!interaction.guild) return interaction.editReply({ content: 'ไม่สามารถใช้คำสั่งใน **Private Chat** ได้' })

        const Member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id)

        if (Member.voice.channelId == null) return interaction.editReply({ embeds: [ErrorEmbeds.NotVoiceChannel()] })

        const ItemId = interaction.options.data[0].value?.toString()
        let Target = interaction.options.data[1] ? interaction.options.data[1].member as GuildMember : undefined

        // if (Target) {
        //     if (Target.user.bot) return interaction.editReply({ content: 'ไม่สามารถใช้ไอเทมกับบอทได้' })
        //     if (Target.user.id === interaction.user.id) return interaction.editReply({ embeds: [ErrorEmbeds.ActionSelf()] })
        //     if (Target.voice.channelId == null) return interaction.editReply({ content: 'ไม่สามารถใช้ไอเทมกับผู้ใช้ที่ไม่อยู่ในห้องเสียงได้' })
        //     if (Target.voice.channelId != Member.voice.channelId) return interaction.editReply({ embeds: [ErrorEmbeds.ChannelNotMatch(Target.user.id)] })
        // }

        // if (interaction.commandName == 'att') {
        //     if (ItemId == '<1>' || ItemId == '1') return client.Attack.execute(Target, interaction)
        // }

        // const Item: any = await client.Database.Items.findOne({
        //     $or: [
        //         { 'Base.ItemId': ItemId?.split('-')[0] },
        //         { 'Base.ItemId': ItemId }
        //     ]
        // }) as any

        // if (!Item) return interaction.editReply({ content: '❌ ไม่พบไอเทม' })

        // const ItemType = findItemType(Item)

        // const Cast: ICasting = Item.UseItem

        // const command: {
        //     default: (ItemParameter: ItemParameter) => Promise<StatusType>
        // } = require(`../../handlers/Item/Type/${ItemType}`)

        // if (!command) return

        // const cmdList: any[] = []

        // const List = (cmd: Object) => {
        //     for (const [key, value] of Object.entries(cmd)) cmdList.push(key)
        // }

        // if (Cast.EnableMe && Cast.Me) List(Cast.Me)

        // if (Cast.EnableAccept && Cast.Accept) List(Cast.Accept)

        // if (Cast.EnableNotAccept && Cast.NotAccept) List(Cast.NotAccept)

        // if (!cmdList.includes(interaction.commandName)) { if (interaction.user.id != '625538855067713537') return interaction.editReply({ content: '❌ ไม่พบคำสั่ง' }) }

        // const Inventory: ItemBase[] = await client.Database.Inventorys.find({
        //     $or: [{
        //         UserId: interaction.user.id, ItemId: ItemId?.split('-')[0]
        //     }, {
        //         UserId: interaction.user.id, ItemId: ItemId
        //     }]
        // }).toArray() as any

        // let isItem = false

        // if (Inventory.length > 0) isItem = true

        // if (!isItem) return interaction.editReply({ content: `**คุณไม่มีไอเทม ${Item.Base.ItemName} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemId}**` })

        // let ItemTarget: ItemBase | undefined

        // if (ItemId?.split('-').length == 3) {
        //     ItemTarget = Inventory.find((value) => value.ItemId == ItemId?.split('-')[0] && value.ItemDate == ItemId?.split('-')[1] && value.ItemCount == parseInt(ItemId?.split('-')[2])) as ItemBase
        // } else {
        //     ItemTarget = Inventory.find((value) => value.CreateTimestramp == Math.min(...Inventory.map((value) => value.CreateTimestramp))) as ItemBase
        // }

        // if (ItemTarget.Locked) return interaction.editReply({ content: '❌ **คุณกำลังใช้ไอเทมนี้อยู่**' })

        // await client.Database.Inventorys.updateOne(ItemTarget, { $set: { Locked: true } })

        // try {
        //     const result = await command.default({
        //         client,
        //         Member,
        //         ItemTarget,
        //         interaction,
        //         Target,
        //         AcceptCheck: interaction.commandName == 'ass',
        //         CommandName: interaction.commandName as Command
        //     })

        //     if (result.isEnd == true) {
        //         await client.Database.Inventorys.updateOne({
        //             UserId: ItemTarget.UserId,
        //             ItemId: ItemTarget.ItemId,
        //             ItemDate: ItemTarget.ItemDate,
        //             ItemCount: ItemTarget.ItemCount
        //         }, {
        //             $set: { Locked: false }
        //         })

        //         if (result.message) interaction.editReply(result.message)

        //         return
        //     }

        //     await client.Database.Inventorys.deleteOne({
        //         UserId: ItemTarget.UserId,
        //         ItemId: ItemTarget.ItemId,
        //         ItemDate: ItemTarget.ItemDate,
        //         ItemCount: ItemTarget.ItemCount
        //     })

        //     return interaction.editReply(result.message as MessageCreateOptions)
        // } catch (err) {
        //     await client.Database.Inventorys.updateOne({
        //         UserId: ItemTarget.UserId,
        //         ItemId: ItemTarget.ItemId,
        //         ItemDate: ItemTarget.ItemDate,
        //         ItemCount: ItemTarget.ItemCount
        //     }, {
        //         $set: { Locked: false }
        //     })

        //     client.log.try_catch_Handling('🔴', `ItemExecute (${ItemTarget.UserId} | ${ItemTarget.ItemId}): ${err}`)

        //     return interaction.editReply({ content: `เกิดข้อผิดพลาด: ${err}` })
        // }
    }
}

export const findItemType = (Item: any) => {
    switch (Item.ItemType) {
        // Effect
        case 'abnormal_effect':
            return 'Effect'
        case 'special_effect':
            return 'Effect'

        // Special
        case 'wing':
            return 'Special'
        case 'item_decoration':
            return 'Special'
        case 'item_Secret':
            return 'Special'
        case 'secret_technique':
            return 'Special'
        case 'race':
            return 'Special'
        case 'blood':
            return 'Special'
        case 'personal_element':
            return 'Special'
        case 'super_power':
            return 'Special'

        // Support
        case 'cultivation_Technique':
            return 'Support'
        case 'cultivation_enhancement':
            return 'Support'

        // Farm
        case 'farm':
            return 'Farm'

        // ItemUsing
        case 'main_weapon':
            return 'ItemUsing'
        case 'secret_weapon':
            return 'ItemUsing'
        case 'general_tips':
            return 'ItemUsing'
        case 'item_use':
            return 'ItemUsing'
        case 'armor':
            return 'ItemUsing'

        // Not
        case 'item_transfrom':
            return 'item_transfrom'

        // Not
        case 'common':
            return 'common'
        default:
            return ''
    }
}

// export const ExecuteTypeToText = (Command: Command) => {
//     if (Command == 'use') return 'ใช้'
//     if (Command == 'ulti') return 'ผสาน'
//     if (Command == 'eat') return 'กิน'
//     if (Command == 'drink') return 'ดื่ม'
// }