import { ActionRowBuilder, ButtonBuilder, ButtonStyle, codeBlock, EmbedBuilder, MessageCreateOptions, TextBasedChannel } from "discord.js"
import Client from "../../structure/Client"
import { IUser, ILevel, IMoney, ButtonType, IRandomCount } from "../../types"
import { NumberWithCommas, CreateId } from "../../Utils/Function"

export const LevelFunction = async (client: Client, User: IUser, TotalUptime: number, nextLevel: ILevel) => {
    const UserId = User.UserId
    const Member = await client.users.fetch(User.UserId)

    const ItemNameFormat = (item: any) => `${item.Base.ItemId}${item.Base.EmojiId ? item.Base.EmojiId : ''}${item.Base.ItemName}`

    const sendMessage = async (message: MessageCreateOptions) => {
        if (nextLevel.ChannelId) {
            try {
                const channel = client.channels.cache.find(channel => channel.id == nextLevel.ChannelId) as TextBasedChannel || await client.channels.fetch(nextLevel.ChannelId) as TextBasedChannel

                await channel.send(message)
            } catch { }
        }

        try {
            await Member.send(message)
        } catch (err) {
            console.log('ไม่สามารถส่งข้อความไปยังผู้ใช้ได้', err)
        }
    }

    const MessageLevel = async () => {
        await sendMessage({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`<@${Member.id}>\n**🎊ขอแสดงความยินดี ที่ท่านเลือนระดับขั้นเป็น** ${codeBlock('diff', `${nextLevel.LevelName}`)}`)
            ]
        })
    }

    const getMoney = async () => {
        const Moneys = nextLevel.Money.sort((a, b) => a.OnlineMore - b.OnlineMore)

        const Money = Moneys.find(money =>
            (User.stats.time + TotalUptime) >= money.OnlineMore * 60 * 60 * 1000 &&
                Moneys[Moneys.indexOf(money) + 1] ?
                (User.stats.time + TotalUptime) < Moneys[Moneys.indexOf(money) + 1].OnlineMore * 60 * 60 * 1000 ?
                    true : false
                : true
        ) as IMoney

        const Id = CreateId(16)

        await client.Database.Buttons.insertOne({
            Id: Id,
            UserId: UserId,
            Timeout: Date.now() + 259_200_000,

            Type: ButtonType.Money,
            Amount: Money.GiveMoney
        })

        await sendMessage({
            embeds: [
                new EmbedBuilder()
                    .setTitle('💰ท่านได้รับเงิน เนื่องจากเลื่อนระดับขั้น')
                    .setDescription(`<@${Member.id}>\n**จำนวน** ${codeBlock('diff', `+${NumberWithCommas(Money.GiveMoney)} แกน`)}`)
                    .setFooter({ text: '❗ หมายเหตุ : ถ้าท่านไม่กดรับเงินภายใน 3 วัน จะถือว่าสละสิทธิ์' })
            ],

            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Success)
                            .setCustomId(Id)
                            .setLabel('👉รับเงิน💰')
                    )
            ]
        })
    }

    const ItemRandom = async () => {
        const RandomCounts = nextLevel.RandomCount.sort((a, b) => a.OnlineMore - b.OnlineMore)

        const RandomCount = RandomCounts.find(count =>
            (User.stats.time + TotalUptime) >= count.OnlineMore * 60 * 60 * 1000 &&
                RandomCounts[RandomCounts.indexOf(count) + 1] ?
                (User.stats.time + TotalUptime) >= RandomCounts[RandomCounts.indexOf(count) + 1].OnlineMore * 60 * 60 * 1000 ?
                    false : true :
                true
        ) as IRandomCount

        const Text: string[] = []

        Text.push(`<@${Member.id}>`)
        Text.push(`**🎁รายการไอเทมที่ท่านมีโอกาสลุ้นได้**`)

        for (let i in nextLevel.RandomItem) {
            const item = nextLevel.RandomItem[i]

            const ItemData = await client.Database.Items(item.ItemId) as any

            Text.push(`${parseInt(i) + 1}.${ItemNameFormat(ItemData)}(${item.Count}ชิ้น)\`โอกาส${item.Probability}% เหลือ ${item.Maxcount - (item.Counted ? item.Counted : 0)} ชิ้น\``)
        }

        const Id = CreateId(16)

        await client.Database.Buttons.insertOne({
            Id: Id,
            UserId: UserId,
            Timeout: Date.now() + 259_200_000,

            Type: ButtonType.Random,
            Level: nextLevel.LevelNo,
            Count: RandomCount.Count,
        })

        await sendMessage({
            embeds: [
                new EmbedBuilder()
                    .setTitle('🎲ได้รับสิทธิ์ลุ้นรับรางวัลไอเทม เนื่องจากเลื่อนระดับขั้น')
                    .setDescription(Text.join('\n'))
                    .setFooter({ text: '❗ หมายเหตุ : ถ้าท่านไม่กดลุ้นรับรางวัลภายใน 3 วัน จะถือว่าสละสิทธิ์' })
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setLabel('🎲ลุ้นรับรางวัล🎁')
                        .setStyle(ButtonStyle.Success)
                        .setCustomId(Id)
                )
            ]
        })
    }

    const ItemSelect = async () => {
        const rows: any[] = []

        const Rewardtext = ['🎁รายการไอเทมที่เลือกได้']

        for (let i in nextLevel.ItemSelect) {
            const item = nextLevel.ItemSelect[i]
            const ItemData = await client.Database.Items(item.ItemId) as any

            const Id = CreateId(16)

            await client.Database.Buttons.insertOne({
                Type: 'Select',
                Id: Id,
                ItemId: item.ItemId,
                Count: item.Count,
                Equip: item.Equip ? true : false,
                Timeout: Date.now() + 259_200_000 // 3 วัน
            })

            if (parseInt(i) % 5 == 0) rows.push(new ActionRowBuilder<ButtonBuilder>())

            rows[rows.length - 1].addComponents(
                new ButtonBuilder()
                    .setLabel(`${item.Text}`)
                    .setStyle(
                        item.Color.toLowerCase().includes('primary') ? ButtonStyle.Primary :
                            item.Color.toLowerCase().includes('secondary') ? ButtonStyle.Secondary :
                                item.Color.toLowerCase().includes('success') ? ButtonStyle.Success :
                                    item.Color.toLowerCase().includes('danger') ? ButtonStyle.Danger :
                                        item.Color.toLowerCase().includes('link') ? ButtonStyle.Link : ButtonStyle.Primary
                    )
                    .setCustomId(Id)
            )

            Rewardtext.push(`${parseInt(i) + 1}.${ItemNameFormat(ItemData)}(${item.Count} ชิ้น)`)
        }

        await sendMessage({
            embeds: [
                new EmbedBuilder()
                    .setTitle('🧧รางวัลเลื่อนระดับขั้น⏫')
                    .setFooter({ text: '❗ หมายเหตุ : ถ้าท่านไม่กดเลือกรางวัลภายใน 3 วัน จะถือว่าสละสิทธิ์' })
                    .setDescription(Rewardtext.join('\n'))
            ],
            components: [...rows]
        })
    }

    const ItemReward = async () => {
        const Text: string[] = []

        Text.push(`<@${Member.id}>`)
        Text.push(`🎁**รายการไอเทมที่ได้ทั้งหมด**`)

        for (let i in nextLevel.ItemReward) {
            const ItemData = await client.Database.Items(nextLevel.ItemReward[i].ItemId) as any

            Text.push(`${parseInt(i) + 1}.${ItemNameFormat(ItemData)}\`(${nextLevel.ItemReward[i].Count} ชิ้น)\``)
        }

        const Id = CreateId(16)

        await client.Database.Buttons.insertOne({
            Id: Id,
            UserId: UserId,
            Timeout: Date.now() + 259_200_000,

            Type: ButtonType.Reward,
            Level: nextLevel.LevelNo,
        })

        await sendMessage({
            embeds: [
                new EmbedBuilder()
                    .setTitle('💎ได้รับไอเทม เนื่องจากเลื่อนระดับขั้น')
                    .setDescription(Text.join('\n'))
                    .setFooter({ text: '❗ หมายเหตุ : ถ้าท่านไม่กดเลือกรางวัลภายใน 3 วัน จะถือว่าสละสิทธิ์' })
            ],
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('👉รับไอเทม🎁')
                            .setStyle(ButtonStyle.Success)
                            .setCustomId(Id)
                    )
            ]
        })
    }

    return {
        sendMessage,
        MessageLevel,
        getMoney,
        ItemRandom,
        ItemSelect,
        ItemReward
    }
}