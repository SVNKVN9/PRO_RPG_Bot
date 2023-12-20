import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, EmbedBuilder, EmbedField, GuildMember, MessageCreateOptions, codeBlock } from "discord.js";
import { NumberWithCommas } from "./Function";
import Client from "../structure/Client";
import { ItemBase } from "../types";

export const ErrorEmbeds = {
    ActionSelf: () => new EmbedBuilder()
        .setDescription('**คุณไม่สามารถ **ขาย / เทรด** ให้ตัวเองได้!**')
        .setTimestamp()
        .setColor('Red'),

    NotVoiceChannel: () => new EmbedBuilder()
        .setDescription('**คุณไม่ได้อยู่ในห้องเสียง**')
        .setTimestamp()
        .setColor('Red'),

    ChannelNotMatch: (TargetId: string | undefined) => new EmbedBuilder()
        .setDescription(`คุณไม่ได้อยู่ห้องเดียวกับ <@${TargetId}>`)
        .setTimestamp()
        .setColor('Red'),

    DontHasItem: () => new EmbedBuilder()
        .setDescription(`**คุณไม่มีไอเทมนี้**`)
        .setTimestamp()
        .setColor('Red'),

    NotEnoughItem: () => new EmbedBuilder()
        .setDescription(`**คุณไม่มีไอเทมนี้เพียงพอ**`)
        .setTimestamp()
        .setColor('Red'),

    NotCash: (MemberId?: string | undefined) => new EmbedBuilder()
        .setDescription(`${MemberId ? `<@${MemberId}> ` : ''}**คุณมีเงินคงเหลือไม่เพียงพอ**`)
        .setTimestamp()
        .setColor('Red'),

    NotTrade: (ItemId: string, ItemName: string) => new EmbedBuilder()
        .setDescription(`**ไอเทม ${ItemId} (${ItemName}) ไม่สามารถขาย / เทรด ได้**`)
        .setTimestamp()
        .setColor('Red'),

    InvalidNumber: () => new EmbedBuilder()
        .setDescription('**กรุณาใส่ตัวเลขให้ถูกต้อง**')
        .setTimestamp()
        .setColor('Red'),

    UseingThisItem: () => new EmbedBuilder()
        .setDescription('**คุณกำลังใช้ไอเทมนี้อยู่**')
        .setTimestamp()
        .setColor('Red'),

    ItemNotFound: () => new EmbedBuilder()
        .setDescription('❌ **ไม่พบไอเทมนี้**')
        .setTimestamp()
        .setColor('Red'),
}

export const SellEmbeds = {
    Confirm: (Member: GuildMember | undefined, Target: GuildMember | undefined, Item: any, Items: string[], Count: string, Price: string): MessageCreateOptions => {
        const Button = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Success)
                    .setCustomId('confirm')
                    .setLabel('ยืนยัน'),

                new ButtonBuilder()
                    .setStyle(ButtonStyle.Danger)
                    .setCustomId('cancel')
                    .setLabel('ยกเลิก')
            )
        const Embed = new EmbedBuilder()
            .setTitle('🔂การซื้อขายไอเทม🔂')
            .setTimestamp()
            .setColor('Blue')
            .setDescription(`
            **❓คุณ ${Target} ต้องการซื้อไอเทมจาก ${Member} หรือไม่**
                    
            ${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName} \`จำนวน ${Count}\`
            ${Items.length < 50 ? `\n${codeBlock('ml', Items.toString().replace(/,/g, ''))}\n` : ''}
            💰ราคา
            ${codeBlock('fix', NumberWithCommas(parseInt(Price)).toString())} แกน
            `)
        return {
            embeds: [Embed],
            components: [Button]
        }
    },
    Complete: (Member: GuildMember | undefined, Target: GuildMember | undefined, Item: any, Items: string[], Count: string, Price: string) => new EmbedBuilder()
        .setTitle('✅การซื้อขายสำเร็จ🔂')
        .setTimestamp()
        .setColor('Blue')
        .setDescription(`
    ⬇ ผู้ขาย ${Member}
    🎁 ผู้ซื้อ ${Target}

    ${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName} \`จำนวน ${Count}\`
    ${Items.length < 50 ? `\n${codeBlock('ml', Items.toString().replace(/,/g, ''))}\n` : ''}
    💰ราคา
    ${codeBlock('fix', NumberWithCommas(parseInt(Price)).toString())} แกน
    `)
}

export const TradeEmbeds = {
    Member: (Member: GuildMember | undefined, Target: GuildMember | undefined, Item: any, Items: string[], Count: number) => new EmbedBuilder()
        .setDescription(`
    **🎁ไอเทมของ** ${Member} ที่ต้องการแลกเปลี่ยนไอเทมกับคุณ ${Target}
    
    ${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName} \`จำนวน ${Count}\`

    ${codeBlock('ml', Items.toString().replace(/,/g, ''))}
    `)
        .setColor('Purple')
        .setFooter({ text: '✅ โปรดระบุ (item ID และ จำนวน) ไอเทมที่ต้องการแลก' }),

    Target: (Member: GuildMember | undefined, Target: GuildMember | undefined, Item: any, Items: string[], Count: string): MessageCreateOptions => {
        return {
            embeds: [new EmbedBuilder()
                .setTitle('🔀การแลกเปลี่ยนไอเทม🔀')
                .setDescription(`
    🎁ไอเทมของ ${Target} ที่ต้องการแลกกับไอเทมคุณ ${Member}
    
    ${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName} \`จำนวน ${Count}\`

    ${codeBlock('ml', Items.toString().replace(/,/g, ''))}
    `)
                .setColor('Purple')],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('complete')
                            .setLabel('✅ ยืนยันการแลกเปลี่ยน')
                            .setStyle(ButtonStyle.Success),

                        new ButtonBuilder()
                            .setCustomId('cancel')
                            .setLabel('❌ ยกเลิกการแลกเปลี่ยน')
                            .setStyle(ButtonStyle.Danger)
                    )
            ]
        }
    },

    Complete: (
        Member: GuildMember, MemberCount: number, MemberItemData: any, MemberItems: string[],
        Target: GuildMember, TargetCount: number, TargetItemData: any, TargetItems: string[]
    ) =>
        new EmbedBuilder()
            .setTitle('✅การแลกเปลี่ยนไอเทมสำเร็จ🔀')
            .setColor('Purple')
            .setTimestamp()
            .setDescription(`
    ⬇ ผู้แลก ${Member}

    ${MemberItemData.Base.ItemId} ${MemberItemData.Base.EmojiId ? MemberItemData.Base.EmojiId : ''} ${MemberItemData.Base.ItemName} \`จำนวน ${MemberCount}\`
    ${codeBlock('ml', MemberItems.toString().replace(/,/g, ''))}

    ⬆ ผู้รับแลก ${Target} \`${TargetCount}\`

    ${TargetItemData.Base.ItemId} ${TargetItemData.Base.EmojiId ? TargetItemData.Base.EmojiId : ''} ${TargetItemData.Base.ItemName} \`จำนวน ${TargetCount}\`
    ${codeBlock('ml', TargetItems.toString().replace(/,/g, ''))}
    `),
}

export const InventoryBuild = async (client: Client, ItemAll: ItemBase[]): Promise<EmbedField[]> => {
    const ItemMap = new Collection<string, ItemBase[]>()

    for (let Item of ItemAll) {
        if (!ItemMap.has(Item.ItemId)) ItemMap.set(Item.ItemId, [])

        const Items = ItemMap.get(Item.ItemId) as ItemBase[]

        Items?.push(Item)

        ItemMap.set(Item.ItemId, Items)
    }

    const now = Date.now()

    const EmbedFields: EmbedField[] = []

    const TimeFormat = (ms: number) => {
        let seconds = Math.floor(ms / 1000)
        let minutes = Math.floor(seconds / 60)
        let hours = Math.floor(minutes / 60)
        let days = Math.floor(hours / 24)

        seconds = seconds % 60
        minutes = minutes % 60
        hours = hours % 24

        return `${days}⋮${hours}⋮${minutes}`
    }

    let i = 0;

    for (let Items of ItemMap.toJSON()) {
        i += 1
        const ItemId = Items[0].ItemId
        const Item = await client.Database.Items(ItemId)

        if (!Item) continue

        const ItemName = `**${i}．${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName} \`(จำนวน ${Items.length})\`**`
        
        EmbedFields.push({
            name: ItemName,
            value: ItemAll.length <= 25 ? codeBlock('ml', `${Items.map(({ ItemId, ItemDate, ItemCount, CreateTimestramp }, index) => {
                const ItemFullId = `${ItemId}-${ItemDate}-${ItemCount}`
                const ItemAge = TimeFormat(now - CreateTimestramp)
                    
                if (Item.Base.ItemAge) {
                    const ToSec = 1000
                    const ToMin = ToSec * 60
                    const ToHour = ToMin * 60
                    const ToDay = ToHour * 24

                    const [day, hour, min, sec] = Item.Base.ItemAge.split('/')

                    const CountDownItemAge = CreateTimestramp + (parseInt(day) * ToDay) + (parseInt(hour) * ToHour) + (parseInt(min) * ToMin) + (parseInt(sec) * ToSec)

                    return `${i}.${index + 1}|${ItemFullId}|${ItemAge}|${TimeFormat(now > CountDownItemAge ? 0 : CountDownItemAge - now)}`
                } else {
                    return `${i}.${index + 1}|${ItemFullId}|${ItemAge}|`
                }

            }).toString().replace(/,/g, '\n')}`) : `\u200b`,
            inline: false
        })
    }
    return EmbedFields
}

export const NumberInput = (canBack: boolean = false) => [
    ...[['1', '2', '3', '4', '5'], ['6', '7', '8', '9', '0']].map(row =>
        new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                row.map((number) =>
                    new ButtonBuilder()
                        .setCustomId(number)
                        .setLabel(number)
                        .setStyle(ButtonStyle.Primary)
                )
            )
    ),
    new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('000')
                .setLabel('000')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('delete')
                .setLabel('ลบ')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('✅ยืนยัน✅')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('back')
                .setEmoji('↩')
                .setLabel('ย้อนกลับ')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(!canBack)
        )
]