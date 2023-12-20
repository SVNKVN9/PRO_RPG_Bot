import { CommandInteraction, GuildMember, Message, SlashCommandBuilder, User } from "discord.js";
import { ILevel, ItemBase, IUser } from '../../types'
import Client from "../../structure/Client";
import Calculator from "../../Utils/Calculator";
import { ErrorEmbeds, TradeEmbeds } from "../../Utils/Components";

interface UserTrede {
    GuildMember: GuildMember
    Inventory: ItemBase[]
    ItemId?: string
    ItemCount?: number
    ItemTarget?: ItemBase[]
    UserStats?: IUser
    Level?: ILevel
}

export default {
    data: [
        new SlashCommandBuilder()
            .setName('trade')
            .setDescription('แลกเปลี่ยน')
            .addUserOption(option => option.setName('ผู้รับแลก').setDescription('ระบุผู้รับแลก').setRequired(true))
            .addIntegerOption(option => option.setName('จำนวน').setDescription('ระบุจำนวนที่ต้องการขาย').setRequired(true).setMinValue(1))
            .addStringOption(option => option.setName('ไอดีไอเทม').setDescription('ระบุไอดีไอเทมที่ต้องการขาย').setRequired(true))
    ],

    execute: async (client: Client, interaction: CommandInteraction) => {
        const Target = interaction.options.getUser('ผู้รับแลก') as User
        const Count = parseInt(interaction.options.get('จำนวน')?.value as string)
        const ItemId = interaction.options.get('ไอดีไอเทม')?.value as string

        if (interaction.user.id == Target.id) return interaction.reply({ embeds: [ErrorEmbeds.ActionSelf()], ephemeral: true })

        const [MemberInventory, TargetInventory, _Member, _Target, Itemdata] = await Promise.all([
            await client.Database.Inventorys.find({ UserId: interaction.user.id }).toArray() as any as ItemBase[],
            await client.Database.Inventorys.find({ UserId: Target.id }).toArray() as any as ItemBase[],
            await interaction.guild?.members.fetch(interaction.user.id),
            await interaction.guild?.members.fetch(Target.id),
            await client.Database.Items(ItemId) as any
        ])

        if (_Member?.voice.channelId != _Target?.voice.channelId) return interaction.reply({ content: `คุณไม่ได้อยู่ห้องเดียวกับ ${_Target}`, ephemeral: true })
        if (!Itemdata) return interaction.reply({ embeds: [ErrorEmbeds.ItemNotFound()], ephemeral: true })
        if (Itemdata.Base.NotTrade) return interaction.reply({ embeds: [ErrorEmbeds.NotTrade(Itemdata.Base.ItemId, Itemdata.Base.ItemName)], ephemeral: true })

        const MemberItem = MemberInventory.filter(item => item.ItemId == ItemId).sort((a, b) => a.CreateTimestramp - b.CreateTimestramp).sort((a, b) => a.ItemCount - b.ItemCount)

        if (MemberItem.length == 0) return interaction.reply({ embeds: [ErrorEmbeds.DontHasItem()], ephemeral: true })
        if (MemberItem.length < Count) return interaction.reply({ embeds: [ErrorEmbeds.NotEnoughItem()], ephemeral: true })

        const ItemsRaw = MemberItem.slice(0, Count)
        const isLocked = ItemsRaw.find(item => item.Locked == true)

        if (isLocked) return interaction.reply({ embeds: [ErrorEmbeds.UseingThisItem()], ephemeral: true })

        await interaction.deferReply()

        setTimeout(() => interaction.deleteReply(), 500)

        const Items = ItemsRaw.map(item => `${item.ItemId}-${item.ItemDate}-${item.ItemCount}\n`)

        const message = await interaction.channel?.send({
            embeds: [TradeEmbeds.Member(_Member, _Target, Itemdata, Items, Count)]
        }) as Message

        const MemberParameter: UserTrede = {
            GuildMember: _Member as GuildMember,
            Inventory: MemberInventory,
            ItemTarget: ItemsRaw,
            ItemId: ItemId,
            ItemCount: Count
        }

        const TargetParameter: UserTrede = {
            GuildMember: _Target as GuildMember,
            Inventory: TargetInventory
        }

        awaitMessage(client, message, MemberParameter, TargetParameter)
    }
}

const TryAgainText = ' โปรดลองใหม่อีกครั้ง | \`<ไอเทมไอดี> <จำนวน>\` **/** \`<ยกเลิก / cancel>\`'

const awaitMessage = async (client: Client, message: Message, Member: UserTrede, Target: UserTrede) => {
    const msg = await message.channel.awaitMessages({ filter: (msg: Message) => msg.author.id == Target.GuildMember.id, max: 1, time: 300_000 })

    if (msg.size == 0) return message.edit({ content: `❌ ${Member.GuildMember} ${Target.GuildMember} หมดเวลาการ **แลกเปลี่ยน**` })

    await Promise.all([
        await message.delete(),
        await msg.first()?.delete()
    ])

    if (msg.first()?.content == 'ยกเลิก' || msg.first()?.content.toLowerCase() == 'cancel') return message?.channel.send({ content: `❌ ${Target.GuildMember} ได้ยกเลิกการแลกเปลี่ยนกับ ${Member}` })

    const [ItemId, Count] = msg.first()?.content.trim().split(/ +/) as string[]

    if (!Number.isInteger(parseInt(Count)) || !Count || !ItemId) {
        let msg = await message.channel.send({ content: `:warning: ${Target} ระบุไม่ถูกต้อง ${TryAgainText}` })

        awaitMessage(client, msg, Member, Target)
        return
    }

    const ItemData = await client.Database.Items(ItemId) as any

    if (!ItemData) {
        let msg = await message.channel.send({ content: `:warning: ${Target} ระบุไอเทมไอดีไม่ถูกต้อง ${TryAgainText}` })

        awaitMessage(client, msg, Member, Target)
        return
    }
    if (ItemData.Base.NotTrade) {
        let msg = await message.channel.send({ content: `:warning: ${Target} ไอเทมนี้ไม่สามารถแลกเปลี่ยนได้ ${TryAgainText}` })

        awaitMessage(client, msg, Member, Target)
        return
    }

    Target.ItemId = ItemId
    Target.ItemCount = parseInt(Count)

    const TargetItem = Target.Inventory.filter(item => item.ItemId == ItemId).sort((a, b) => a.CreateTimestramp - b.CreateTimestramp).sort((a, b) => a.ItemCount - b.ItemCount)

    if (TargetItem.length == 0) {
        let msg = await message.channel.send({ content: `:warning: ${Target} คุณไม่มีไอเทมนี้ ${TryAgainText}` })

        awaitMessage(client, msg, Member, Target)
        return
    }

    if (TargetItem.length < parseInt(Count)) return message.channel.send({ content: `${Target.GuildMember}`, embeds: [ErrorEmbeds.NotEnoughItem()] })

    const ItemsRaw = TargetItem.slice(0, parseInt(Count))
    const isLocked = ItemsRaw.find(item => item.Locked == true)

    Target.ItemTarget = ItemsRaw

    if (isLocked) return message.channel.send({ content: `${Target.GuildMember}`, embeds: [ErrorEmbeds.UseingThisItem()] })

    const Items = ItemsRaw.map(item => `${item.ItemId}-${item.ItemDate}-${item.ItemCount}\n`)

    const ButtonMSG = await message.channel.send(TradeEmbeds.Target(Member.GuildMember, Target.GuildMember, ItemData, Items, Count))

    const interaction = await message.channel.awaitMessageComponent({ filter: (i) => i.user.id == Member.GuildMember.id, time: 60_000 })

    ButtonMSG.delete()
    interaction.deferUpdate()

    if (interaction.customId == 'cancel') return message.channel.send({ content: `❌ ${Member} ได้ยกเลิกการแลกเปลี่ยนกับ ${Target}` })

    Member.UserStats = await client.Database.Users.findOne({ UserId: Member.GuildMember.id }) as any
    Target.UserStats = await client.Database.Users.findOne({ UserId: Target.GuildMember.id }) as any

    Member.Level = await client.Database.Level.findOne({ LevelNo: Member.UserStats?.stats.level.toString() }) as any
    Target.Level = await client.Database.Level.findOne({ LevelNo: Target.UserStats?.stats.level.toString() }) as any

    const loadingMsg = await message.channel.send({ content: `**กำลังแลกเปลี่ยน**` })

    try {
        const CapacityCheck = async (User: UserTrede, ItemInput: ItemBase[]): Promise<boolean> => {
            const result = await Promise.all(User.Inventory.map(async (item) => await client.Database.Items(item.ItemId))) as any[]
            const sendItem = await client.Database.Items(User.ItemId) as any
            const reviceItem = await client.Database.Items(ItemInput[0].ItemId) as any

            const { CP } = await Calculator(client, User.UserStats as IUser, User.Level as ILevel)

            const CAP_send = parseInt(sendItem.Base.Size ? sendItem.Base.Size : 1) * (User.ItemTarget?.length as number)
            const CAP_revice = parseInt(reviceItem.Base.Size ? reviceItem.Base.Size : 1) * ItemInput.length

            const TotelCP = result.reduce((p, c) => {
                try {
                    return p + (c.Base.Size ? parseInt(c.Base.Size) : 1)
                } catch (err) {
                    client.log.try_catch_Handling('🔴', `Trade Command Error: ${err}`)

                    return p + 1
                }
            })

            if (((TotelCP + CAP_revice) - CAP_send) > CP) return false
            else return true
        }

        const MemberisPass = await CapacityCheck(Member, Target.ItemTarget)

        if (!MemberisPass) return loadingMsg.edit({ content: `❌ ${Member.GuildMember} คุณมีพื้นที่เก็บไม่เพียงพอ` })

        const TargetisPass = await CapacityCheck(Target, Member.ItemTarget as ItemBase[])

        if (!TargetisPass) return loadingMsg.edit({ content: `❌ ${Target.GuildMember} คุณมีพื้นที่เก็บไม่เพียงพอ` })

        const [resultOne, resultTwo, MemberItemData, TargetItemData] = await Promise.all([
            await Promise.all((Member.ItemTarget as ItemBase[]).map(
                async item => await client.Database.Inventorys.updateOne(
                    { UserId: Member.GuildMember.id, ItemId: item.ItemId, ItemDate: item.ItemDate, ItemCount: item.ItemCount },
                    { $set: { UserId: Target.GuildMember.id } }
                )
            )),
            await Promise.all((Target.ItemTarget as ItemBase[]).map(
                async item => await client.Database.Inventorys.updateOne(
                    { UserId: Target.GuildMember.id, ItemId: item.ItemId, ItemDate: item.ItemDate, ItemCount: item.ItemCount },
                    { $set: { UserId: Member.GuildMember.id } }
                )
            )),

            await client.Database.Items(Member.ItemId) as any,
            await client.Database.Items(Target.ItemId) as any
        ])

        const MemberItems = Member.ItemTarget?.map(item => `${item.ItemId}-${item.ItemDate}-${item.ItemCount}\n`) as string[]
        const TargetItems = Target.ItemTarget?.map(item => `${item.ItemId}-${item.ItemDate}-${item.ItemCount}\n`) as string[]

        loadingMsg.edit({
            content: '',
            embeds: [TradeEmbeds.Complete(
                Member.GuildMember, Member.ItemCount as number, MemberItemData, MemberItems,
                Target.GuildMember, Target.ItemCount, TargetItemData, TargetItems
            )]
        })
    } catch (err) {
        loadingMsg.edit({ content: `**เกิดข้อผิดพลาด** ${err}` })
    }
}