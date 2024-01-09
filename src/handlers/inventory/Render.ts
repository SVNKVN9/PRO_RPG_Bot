import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, codeBlock } from "discord.js"
import Client from "../../structure/Client"
import { ICooldown, ILevel, IUser, ItemBase, ItemsType } from "../../types"
import Calculator from "../../Utils/Calculator"
import { NumberWithCommas, msToDHMS } from "../../Utils/Function"
import { InventoryBuild } from "../../Utils/Components"

interface Group {
    Id: string,
    Index: string,
    Name: string
}

export const GroupsPage = async (client: Client, UserId: string, pageNo: number): Promise<{ embeds: EmbedBuilder[], components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] }> => {
    const Items = await client.Database.Inventorys.aggregate([
        {
            $match: {
                $or: [
                    { UserId, Select: false },
                    {
                        UserId, Select: { $exists: false }
                    }
                ]
            }
        },
        { $group: { _id: "$ItemId", count: { $sum: 1 } } },
        { $lookup: { from: "items", localField: "_id", foreignField: "Base.ItemId", as: "Item" } },
        { $lookup: { from: "groups", localField: "Item.groupId", foreignField: "Id", as: "Group" } }
    ]).toArray() as {
        _id: string,
        count: number,
        Item: ItemsType[]
        Group: Group[]
    }[]

    const user: IUser = await client.Database.Users.findOne({ UserId }) as any
    const level: ILevel = await client.Database.Level.findOne({ LevelNo: user.stats.level.toString() }) as any

    let TotelCP = 0

    const Pages: { Selection: StringSelectMenuBuilder, str: string[] }[] = []

    const GroupAdded = new Map<string, boolean>()

    const addOptionsAndString = (group: Group) => {
        if (GroupAdded.has(group.Id)) return

        const lastPage = Pages[Pages.length - 1];

        lastPage.Selection.addOptions({
            label: `${group.Index} ${group.Name}`,
            value: group.Index.toString(),
        });

        lastPage.str.push(`${parseInt(group.Index) < 10 ? `${group.Index}. ` : `${group.Index}.`} ${group.Name}【${Items.filter((Item) => Item.Group[0].Id == group.Id).length}】\n`);

        GroupAdded.set(group.Id, true)
    };

    const groups_sort = Items.sort((a, b) => {
        if (!a.Group[0] || !b.Group[0]) return 0

        return parseInt(a.Group[0].Index) - parseInt(b.Group[0].Index)
    })

    for (let Group of groups_sort) {
        const baseSize = Group.Item[0].Base.Size;
        TotelCP += !baseSize ? Group.count : parseInt(baseSize) * Group.count;

        const lastPage = Pages[Pages.length - 1];

        if (lastPage && lastPage.Selection.options.length < 25) {
            addOptionsAndString(Group.Group[0]);
        } else {
            Pages.push({
                Selection: new StringSelectMenuBuilder()
                    .setCustomId('groups-select')
                    .setPlaceholder('✅ เลือกหมวดหมู่ที่ต้องการเปิด'),
                str: [],
            });

            addOptionsAndString(Group.Group[0]);
        }
    }

    const { CP } = await Calculator(client, user, level)

    const Embed = new EmbedBuilder()
        .setTitle(`🎒 ช่องเก็บไอเทมหลัก`)
        .setDescription(codeBlock('js', `\n⬛ ความจุรวม : ${NumberWithCommas(CP)}\n✅ ใช้ไป     : ${NumberWithCommas(TotelCP)} (${((TotelCP / CP) * 100).toFixed(2)}%)\n⬜ คงเหลือ   : ${NumberWithCommas(CP - TotelCP)} (${(((CP - TotelCP) / CP) * 100).toFixed(2)}%)`))
        .addFields({
            name: 'ลำดับ  │ หมวดหมู่  │ ชนิด │ จำนวน',
            value: codeBlock('js', `${Pages[pageNo - 1] ? Pages[pageNo - 1].str.toString().replace(/,/g, '') : ''}`)
        })
        .setFooter({ text: `หน้า ${pageNo}/${Pages.length}` })

    const SelectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(Pages[pageNo - 1] ?
            Pages[pageNo - 1].Selection :
            new StringSelectMenuBuilder()
                .setCustomId('groups-select')
                .setPlaceholder('✅ เลือกหมวดหมู่ที่ต้องการเปิด')
                .setDisabled(true)
                .addOptions({
                    label: 'NONE',
                    value: 'NONE'
                })
        )

    return {
        embeds: [Embed],
        components: [
            ...[
                SelectRow,
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('showSelect')
                        .setLabel('💼เปิดช่องเก็บไอเทมรอง')
                        .setStyle(ButtonStyle.Success)
                )
            ],
            ...Pages.length > 1 ? [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('groups-previous')
                            .setLabel('⬅️ก่อนหน้า')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(pageNo - 1 == 0),

                        new ButtonBuilder()
                            .setCustomId('groups-next')
                            .setLabel('หน้าถัดไป➡️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(pageNo == Pages.length)
                    )
            ] : []
        ]
    }
}

export const ItemsList = async (client: Client, groupNo: number, pageNo: number, UserId: string) => {
    const Items = await client.Database.Inventorys.aggregate([
        {
            $match: {
                $or: [
                    { UserId, Select: false },
                    {
                        UserId, Select: { $exists: false }
                    }
                ]
            }
        },
        { $group: { _id: "$ItemId", count: { $sum: 1 } } },
        { $lookup: { from: "items", localField: "_id", foreignField: "Base.ItemId", as: "Item" } },
        { $lookup: { from: "groups", localField: "Item.groupId", foreignField: "Id", as: "Group" } },
        {
            $match: {
                $or: [
                    { "Group.Index": `${groupNo}` },
                    { "Group.Index": groupNo }
                ]
            }
        },
        { $sort: { _id: 1 } }
    ]).toArray() as {
        _id: string,
        count: number,
        Item: ItemsType[]
        Group: Group[]
    }[]

    const TotalCount = Items.reduce((total, item) => total + item.count, 0)

    const GroupName = Items[0].Group[0].Name

    let pages: {
        embed: EmbedBuilder,
        selection: StringSelectMenuBuilder,
        use: StringSelectMenuBuilder,
        toSelect: StringSelectMenuBuilder
    }[] = []

    let round = 0

    const cooldowns = await client.Database.Cooldowns.find({ UserId }).toArray() as any as ICooldown[]
    const now = Date.now()

    for (let Item of Items) {
        if ((round % 10) == 0) {
            pages.push({
                embed: new EmbedBuilder()
                    .setTitle(`${groupNo}．${GroupName}\`〔จำนวนรวม ${TotalCount}〕\``),
                selection: new StringSelectMenuBuilder()
                    .setCustomId('ItemDetail')
                    .setPlaceholder('👀เลือกชนิดไอเทมที่ต้องการเปิด'),
                use: new StringSelectMenuBuilder()
                    .setCustomId('select-use')
                    .setPlaceholder('✅เลือกใช้ไอเทม'),
                toSelect: new StringSelectMenuBuilder()
                    .setCustomId('inv-select-more')
                    .setPlaceholder('⬇️🔢เลือกย้ายไอเทมไปช่องรอง (จำนวนมาก)')
            })
        }

        round += 1

        const cooldown = cooldowns.find((cooldown) => cooldown.ItemId == Item._id)

        const defaultObject = { label: `${round}. ${Item.Item[0].Base.ItemId} ${Item.Item[0].Base.ItemName}`, value: `${Item.Item[0].Base.ItemId}` }

        pages[pages.length - 1].embed.addFields({
            name: `${round}． ${Item.Item[0].Base.ItemId} ${Item.Item[0].Base.EmojiId ?? ''} ${Item.Item[0].Base.ItemName} \`(จำนวน ${Item.count})\``,
            value: `╰${cooldown && cooldown.TimeOut > now ? `⌛${msToDHMS(cooldown.TimeOut - now)}` : '✅ พร้อมใช้'}`
        })
        pages[pages.length - 1].selection.addOptions(defaultObject)
        pages[pages.length - 1].use.addOptions(defaultObject)
        pages[pages.length - 1].toSelect.addOptions(defaultObject)
    }

    if (!pages.length) {
        pages.push({
            embed: new EmbedBuilder()
                .setTitle(`${groupNo}．${GroupName}\`〔จำนวนรวม ${TotalCount}〕\``),
            selection: new StringSelectMenuBuilder()
                .setCustomId('ItemDetail')
                .setPlaceholder('👀เลือกชนิดไอเทมที่ต้องการเปิด')
                .addOptions({ label: 'NONE', value: 'NONE' }),
            use: new StringSelectMenuBuilder()
                .setCustomId('select-use')
                .setPlaceholder('✅เลือกใช้ไอเทม'),
            toSelect: new StringSelectMenuBuilder()
                .setCustomId('inv-select-more')
                .setPlaceholder('⬇️🔢เลือกย้ายไอเทมไปช่องรอง (จำนวนมาก)')
        })
    }

    const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`Items-0-0`)
                .setLabel('↩️ย้อนกลับ')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId(`Items-${groupNo}-${pageNo - 1}`)
                .setDisabled((pageNo - 1) == 0)
                .setLabel('⬅️ก่อนหน้า')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`Items-${groupNo}-${pageNo + 1}`)
                .setLabel('หน้าถัดไป➡️')
                .setDisabled((pageNo + 1) > pages.length)
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('showSelect')
                .setLabel('💼เปิดช่องเก็บไอเทมรอง')
                .setStyle(ButtonStyle.Success)
        )

    if (pages.length == 0) {
        const StringSelect = new StringSelectMenuBuilder()
            .setCustomId('NONE')
            .addOptions({ label: 'ไม่มีไอเทม', value: 'return' })
            .setDisabled(true)

        return {
            embeds: [pages[pageNo - 1].embed],
            row1,
            row2: new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(StringSelect),
            row3: new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(StringSelect),
            row4: new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(StringSelect)
        }
    } else {
        pages.map((value, index) => value.embed.setFooter({ text: `หน้า ${index + 1}/${pages.length}` }))

        return {
            embeds: [pages[pageNo - 1].embed],
            row1,
            row2: new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(pages[pageNo - 1].selection),
            row3: new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(pages[pageNo - 1].use),
            row4: new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(pages[pageNo - 1].toSelect)
        }
    }
}

export const ItemDetail = async (client: Client, UserId: string, ItemId: string, pageNo: number) => {
    const ItemCount = await client.Database.Inventorys.find({ UserId, ItemId }).count()
    const Items = await client.Database.Inventorys.find({ UserId, ItemId }).skip((pageNo - 1) * 20).limit(20).toArray() as ItemBase[]

    const Item = await client.Database.Items(ItemId) as ItemsType
    const cooldown = await client.Database.Cooldowns.findOne({ UserId, ItemId }) as any as { UserId: string, ItemId: string, Timeout: number }
    const now = Date.now()

    let data: { text: string, choice: StringSelectMenuOptionBuilder }[] = []

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

    for (let i = 0; i < Items.length; i++) {
        const now = Date.now()
        const ItemId = `${Items[i].ItemId}-${Items[i].ItemDate}-${Items[i].ItemCount}`
        const ItemLable = `${i + 1}|${ItemId}`
        const ItemAge = TimeFormat(now - Items[i].CreateTimestramp)

        if (Item.Base.ItemAge) {
            const ToSec = 1000
            const ToMin = ToSec * 60
            const ToHour = ToMin * 60
            const ToDay = ToHour * 24

            const [day, hour, min, sec] = Item.Base.ItemAge.split('/')

            const CountDownItemAge = Items[i].CreateTimestramp + (parseInt(day) * ToDay) + (parseInt(hour) * ToHour) + (parseInt(min) * ToMin) + (parseInt(sec) * ToSec)

            data.push({
                text: `${ItemLable}|${ItemAge}|${TimeFormat(now > CountDownItemAge ? 0 : CountDownItemAge - now)}`,
                choice: new StringSelectMenuOptionBuilder({
                    label: ItemLable,
                    value: ItemId
                })
            })
        } else {
            data.push({
                text: `${ItemLable}|${ItemAge}|`,
                choice: new StringSelectMenuOptionBuilder({
                    label: ItemLable,
                    value: ItemId
                })
            })
        }
    }

    const Embed = new EmbedBuilder()
        .setTitle(`${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName} \`จำนวน ${Items.length}\``)
        .setDescription(`╰${cooldown ? cooldown.Timeout > now ? `⌛${msToDHMS(cooldown.Timeout - now)}` : '✅ พร้อมใช้' : '✅ พร้อมใช้'}`)
        .addFields({
            name: 'ลำดับ | ID ประจำไอเทม | อายุไอเทม | อายุที่เหลือ',
            value: `${codeBlock('ml', `${data ? data.map(Items => Items.text).toString().replace(/,/g, '\n') : '\n'}`)}\n❓ อายุไอเทม และอายุที่เหลือ คือ \`|วัน⋮ชั่วโมง⋮นาที|\``
        })
        .setFooter({ text: `หน้า ${pageNo}/${Math.ceil(ItemCount / 20)}` })

    return {
        embeds: [Embed],
        row1: new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`Details-back-${ItemId}`)
                    .setLabel('↩️ย้อนกลับ')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId(`Details-${ItemId}-${pageNo - 1}`)
                    .setDisabled((pageNo - 1) == 0)
                    .setLabel('◀️ก่อนหน้า')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId(`Details-${ItemId}-${pageNo + 1}`)
                    .setLabel('หน้าถัดไป▶️')
                    .setDisabled((pageNo + 1) > data.length)
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId(`info-${ItemId}`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📑')
                    .setLabel('ดูข้อมูล'),
            ),
        row2: new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`inv-select`)
                    .setMaxValues(data ? data.length : 1)
                    .setPlaceholder(`⬇️☑️เลือกย้ายไอเทมไปช่องรอง (ทีละรายการ)`)
                    .addOptions(data ? data.map(Items => Items.choice) : [{ label: '00000', value: '00000' }])
                    .setDisabled(data == undefined)
            ),
    }
}

export const SelectEmbed = async (client: Client, UserId: string) => {
    const Select = await client.Database.Inventorys.find({ UserId, Select: true }).toArray() as ItemBase[]

    const Embed = new EmbedBuilder()
        .setTitle(`💼 ช่องเก็บไอเทมรอง`)
        .addFields(await InventoryBuild(client, Select))

    const ItemMap = new Collection<string, ItemBase[]>()

    for (let Item of Select) {
        if (!ItemMap.has(Item.ItemId)) ItemMap.set(Item.ItemId, [])

        const Items = ItemMap.get(Item.ItemId) as ItemBase[]

        Items?.push(Item)

        ItemMap.set(Item.ItemId, Items)
    }

    const Selection = new StringSelectMenuBuilder()
        .setDisabled(Select.length == 0)
        .addOptions(Select.length == 0 ? [{ label: 'NONE', value: 'NONE' }] :
            ItemMap.toJSON().map((Items, index) => {
                const Item = Items[0]
                return {
                    label: `${index + 1}．${Item.ItemId}`,
                    value: Item.ItemId
                }
            }))
        .setMaxValues(1)

    const ManageSelection = new StringSelectMenuBuilder()
        .setDisabled(true || Select.length == 0)
        .addOptions(Select.length == 0 ? [{ label: 'NONE', value: 'NONE' }] :
            ItemMap.toJSON().map((Items, index) => {
                const Item = Items[0]
                return {
                    label: `${index + 1}．${Item.ItemId}`,
                    value: `manage-${Item.ItemId}`
                }
            }))
        .setMaxValues(1)

    return {
        embeds: [Embed],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`use`)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅')
                        .setDisabled(Select.length != 1)
                        .setLabel('ใช้'),

                    new ButtonBuilder()
                        .setCustomId(`give`)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🎁')
                        .setDisabled(Select.length == 0)
                        .setLabel('ให้'),

                    new ButtonBuilder()
                        .setCustomId(`sell`)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('💰')
                        .setDisabled(Select.length == 0)
                        .setLabel('ขาย'),
                    new ButtonBuilder()
                        .setCustomId(`trade`)
                        .setLabel('แลก')
                        .setEmoji('🔁')
                        .setDisabled(Select.length == 0)
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('place')
                        .setEmoji('📦')
                        .setLabel('วาง')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(Select.length == 0)
                ),

            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setCustomId('create')
                        .setEmoji('♻')
                        .setLabel('สร้าง')
                        .setDisabled(true),

                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('move-all')
                        .setLabel('⬆️ย้ายทั้งหมด⬆️'),

                    new ButtonBuilder()
                        .setCustomId(`destory`)
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⚠')
                        .setDisabled(Select.length == 0)
                        .setLabel('ทำลาย'),

                    new ButtonBuilder()
                        .setCustomId('refresh')
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel('🔄รีหน้าใหม่')
                ),

            new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(Selection
                    .setPlaceholder('⬆️🔢เลือกย้ายไอเทมไปช่องหลัก (จำนวนมาก)')
                    .setCustomId('unSelect')
                ),

            new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(ManageSelection
                    .setPlaceholder('✅เลือกจัดการไอเทมจากช่องรอง')
                    .setCustomId('manage-item')
                )
        ]
    }
}