import { ActionRowBuilder, ButtonInteraction, EmbedBuilder, GuildMember, MessageCreateOptions, StringSelectMenuBuilder } from "discord.js";
import Client from "../../structure/Client";
import { ErrorEmbeds } from "../../Utils/Components";
import SelectUser from "./SelectUser";
import { ItemParameter, ItemBase, ItemsType, StatusType } from "../../types";

export default async (client: Client, interaction: ButtonInteraction, Select: ItemBase) => {
    const Member = interaction.guild?.members.cache.get(interaction.user.id) || await interaction.guild?.members.fetch(interaction.user.id)

    if (!Member?.voice.channelId) return interaction.editReply({ embeds: [ErrorEmbeds.NotVoiceChannel()] })

    const Item = await client.Database.Items(Select.ItemId) as ItemsType

    const ItemNameFormat = `${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName}`

    const SelectMenu = new StringSelectMenuBuilder()
        .setCustomId('type')
        .setMinValues(1)
        .setPlaceholder('✅ เลือกรูปแบบการใช้ไอเทม')

    const TypeUse = Item.ConditionItem.TypeUse

    if (!TypeUse) return interaction.editReply({
        content: `❌ ไอเทมนี้ยังไม่สามารถใช้งานได้`
    })

    if (TypeUse.Me) SelectMenu.addOptions({
        label: TypeUse.MeMessage ?? '1.🔵ใช้,กิน,ดื่ม,สวมใส่,ผสาน',
        description: 'ส่งผมต่อตนเอง',
        value: 'me',
    })

    if (TypeUse.Accept) SelectMenu.addOptions({
        label: TypeUse.AcceptMessage ?? '2.🟡ป้อนของกินดื่ม,สวมใส่ให้',
        description: 'ส่งผลต่อผู้อื่น โดยผู้นั้นต้องยินยอม',
        value: 'accept',
    })

    if (TypeUse.NotAccept) SelectMenu.addOptions({
        label: TypeUse.NotAcceptMessage ?? '3.🔴โจมตี,สนับสนุน',
        description: 'ส่งผลต่อผู้อื่น โดยที่ผู้นั้นไม่ต้องยินยอม',
        value: 'notaccept'
    })

    if (TypeUse.Farm) SelectMenu.addOptions({
        label: TypeUse.FarmMessage ?? '4.🟢ปลูกพืช, ติดตั้ง',
        description: 'ส่งผลลงห้องข้อความเป็นที่ฟาม',
        value: 'build'
    })

    if (!SelectMenu.options.length) return interaction.editReply({
        content: `❌ ไอเทมนี้ยังไม่สามารถใช้งานได้`
    })

    const ActionTypeMessage = await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setTitle(`✅ใช้ไอเทม ( ${ItemNameFormat} )`)
        ],
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(SelectMenu)
        ]
    })

    const ActionInteraction = await ActionTypeMessage.awaitMessageComponent({
        filter: (inter) => inter.user.id == interaction.user.id,
        time: 60_000
    })

    if (!ActionInteraction) return
    if (!ActionInteraction.isStringSelectMenu()) return

    await ActionInteraction.deferUpdate()

    let TargetId: string | undefined = undefined

    switch (ActionInteraction.values[0]) {
        case 'me':
            break;
        case 'accept':
            TargetId = await SelectUser({
                interaction,
                Member: Member as GuildMember,
                Embed: new EmbedBuilder()
                    .setTitle(`🟡 ป้อน ( ${ItemNameFormat} ) ให้กับ❓`)
                    .setColor('Yellow')
            })
            break;
        case 'notaccept':
            TargetId = await SelectUser({
                interaction,
                Member: Member as GuildMember,
                Embed: new EmbedBuilder()
                    .setTitle(`🔴 เลือกเป้าหมาย ( ${ItemNameFormat} ) เพื่อโจมตี`)
                    .setColor('Red')
            })
            break;
        case 'build':
            break;
    }

    const { UserId, ItemId, ItemDate, ItemCount } = Select

    try {
        await interaction.editReply({ content: '**กำลังทำงาน**', embeds: [], components: [] })

        const command: {
            default: (ItemParameter: ItemParameter) => Promise<StatusType>
        } = require(`../Item/Type/${Item.Type}`)

        if (Select.Locked) return await interaction.editReply({ content: '❌ **คุณกำลังใช้ไอเทมนี้อยู่**' })

        await client.Database.Inventorys.updateOne({ UserId, ItemId, ItemDate, ItemCount }, { $set: { Select: false, Locked: true } })

        const result = await command.default({
            client: client,
            Member: Member,
            ItemTarget: Select,
            interaction: interaction as any,
            Target: TargetId ? await interaction.guild?.members.fetch(TargetId) : undefined,
            AcceptCheck: ActionInteraction.values[0] == 'accept',
        })

        await client.Database.Inventorys.updateOne({ UserId, ItemId, ItemDate, ItemCount }, { $set: { Select: false, Locked: false } })

        if (result.message) return interaction.editReply(result.message)
    } catch (err) {
        await client.Database.Inventorys.updateOne({ UserId, ItemId, ItemDate, ItemCount }, { $set: { Locked: false } })

        client.log.try_catch_Handling('🔴', `ItemExecute (${UserId} | ${ItemId}): ${err}`)

        return interaction.editReply({ content: `เกิดข้อผิดพลาด: ${err}` })
    }
}