import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, EmbedBuilder, Message, StringSelectMenuBuilder, StringSelectMenuInteraction, codeBlock } from "discord.js";
import Client from "../../structure/Client";
import { ItemBase } from "../../types";
import { MakeData } from "./Makedata";
import { GroupsPage, ItemDetail, ItemsList, SelectEmbed } from "./Render";
import { contains } from "./Function/Contains";
import Trade from "./Trade";
import Sell from "./Sell";
import Give from "./Give";
import Use from "./Use";
// import { InfoExecute } from "../../Utils/Info";
import Place from "./Place";
import Destroy from "./Destroy";
import { InventoryBuild, NumberInput } from "../../Utils/Components";
import { NumberWithCommas } from "../../Utils/Function";

type PageState = 'Groups' | 'Items' | 'List' | 'Select'
interface InventoryState {
    State: PageState
    GroupPageNo: number | undefined
    GroupsNo: number | undefined
    ListPageNo: number | undefined
    ItemId: string | undefined
    ItemPageNo: number | undefined
}

export default class Inventory {
    private State: PageState
    private GroupPageNo: number | undefined
    private GroupsNo: number | undefined
    private ListPageNo: number | undefined
    private ItemId: string | undefined
    private ItemPageNo: number | undefined

    constructor(public client: Client, private UserId: string, private Baseinteraction: CommandInteraction | ButtonInteraction | StringSelectMenuInteraction, InventoryState?: InventoryState) {
        this.State = 'Groups'
        this.GroupPageNo = 1

        if (InventoryState) {
            const { State, GroupPageNo, GroupsNo, ListPageNo, ItemId, ItemPageNo } = InventoryState

            this.State = State
            this.GroupPageNo = GroupPageNo
            this.GroupsNo = GroupsNo
            this.ListPageNo = ListPageNo
            this.ItemId = ItemId
            this.ItemPageNo = ItemPageNo
        }

        this.FirstExecute(Baseinteraction)
    }

    private async FirstExecute(interaction: CommandInteraction | ButtonInteraction | StringSelectMenuInteraction) {
        return this.awaitComponent(await interaction.editReply(await this.Render()))
    }

    private async InventoryFetch() {
        const Inventory = await this.client.Database.Inventorys.find({ UserId: this.UserId }).toArray() as any as ItemBase[]

        return {
            isSelect: Inventory.filter(Item => Item.Select),
            NotSelect: Inventory.filter(Item => !Item.Select)
        }
    }

    public async Render(): Promise<{ embeds: EmbedBuilder[], components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] }> {
        if (this.State == 'Groups') {
            const { embeds, components } = await GroupsPage(this.client, this.UserId, this.GroupPageNo as number)

            return {
                embeds: [...embeds],
                components: [...components]
            }
        } else if (this.State == 'Items') {
            const { isSelect, NotSelect } = await this.InventoryFetch()

            const data = await MakeData(this.client, NotSelect)

            const { embeds, row1, row2, row3, row4 } = await ItemsList(this.client, data, this.GroupsNo as number, this.ListPageNo as number, this.UserId)

            return {
                embeds: [...embeds],
                components: [row1, row2, row3, row4]
            }
        } else if (this.State == 'List') {
            const { embeds, row1, row2 } = await ItemDetail(this.client, this.UserId, this.ItemId as string, this.ItemPageNo as number)

            return {
                embeds: [...embeds],
                components: [row1, row2]
            }
        } else {
            const { components, embeds } = await SelectEmbed(this.client, this.UserId)

            return {
                embeds: embeds,
                components: components
            }
        }
    }

    private async awaitComponent(message: Message): Promise<void> {
        const interaction = await message.awaitMessageComponent({
            filter: (interaction) => interaction.user.id == this.UserId ? true : this.client.config.OnwerIds.includes(interaction.user.id),
            time: 300_000,
        }).catch(() => { })

        if (!interaction) return

        if (
            !(interaction instanceof ButtonInteraction) &&
            !(interaction instanceof StringSelectMenuInteraction)
        ) return

        // ignore customId
        if (contains(interaction.customId, ['isPass', 'user-select'])) return this.awaitComponent(message)

        try {
            if (contains(interaction.customId, ['use', 'showSelect', 'ItemDetail'])) {
                await interaction.deferReply({ ephemeral: true })
            } else {
                await interaction.deferUpdate({ fetchReply: true })
            }
        } catch { }

        await this.PageGroup(interaction)

        const { isSelect, NotSelect } = await this.InventoryFetch()

        await this.PageItemList(isSelect, NotSelect, interaction)

        await this.PageItemDetail(isSelect, interaction)

        await this.PageSelect(isSelect, interaction)

        return this.awaitComponent(message)
    }

    private async PageGroup(interaction: StringSelectMenuInteraction | ButtonInteraction) {
        if (interaction.customId == 'groups-select') {
            if (!interaction.isStringSelectMenu()) return

            this.State = 'Items'
            this.GroupsNo = parseInt(interaction.values[0])
            this.ListPageNo = 1

            await interaction.editReply(await this.Render())
        }

        if (interaction.customId == 'groups-previous') {
            if (!interaction.isButton()) return

            this.GroupPageNo = this.GroupPageNo as number - 1

            await interaction.editReply(await this.Render())
        }

        if (interaction.customId == 'groups-next') {
            if (!interaction.isButton()) return

            this.GroupPageNo = this.GroupPageNo as number + 1

            await interaction.editReply(await this.Render())
        }
    }

    private async PageItemList(isSelect: ItemBase[], NotSelect: ItemBase[], interaction: ButtonInteraction | StringSelectMenuInteraction) {
        if (interaction.customId.includes('Items')) {
            if (!interaction.isButton()) return

            const [cat, groupNo, pageNo] = interaction.customId.split('-')

            this.GroupsNo = parseInt(groupNo)
            this.ListPageNo = parseInt(pageNo)

            if (this.GroupsNo == 0 && this.ListPageNo == 0) this.State = 'Groups'

            await interaction.editReply(await this.Render())
        }

        if (interaction.customId == 'showSelect') {
            if (!interaction.isButton()) return

            new Inventory(this.client, this.UserId, interaction, {
                State: 'Select',
                GroupPageNo: this.GroupPageNo,
                GroupsNo: this.GroupsNo,
                ListPageNo: this.ListPageNo,
                ItemId: this.ItemId,
                ItemPageNo: this.ItemPageNo
            })
        }

        if (interaction.customId == 'ItemDetail') {
            if (!interaction.isStringSelectMenu()) return

            this.State = 'List'
            this.ItemPageNo = 1
            this.ItemId = interaction.values[0].split('-')[0]

            new Inventory(this.client, this.UserId, interaction, {
                State: 'Select',
                GroupPageNo: this.GroupPageNo,
                GroupsNo: this.GroupsNo,
                ListPageNo: this.ListPageNo,
                ItemId: this.ItemId,
                ItemPageNo: this.ItemPageNo
            })

            await this.Baseinteraction.editReply(await this.Render())
        }

        if (interaction.customId == 'select-use') {
            if (!interaction.isStringSelectMenu()) return

            let Item = isSelect.find(Item => Item.ItemId == interaction.values[0])

            if (!Item) Item = NotSelect.find(Item => Item.ItemId == interaction.values[0])

            Use(this.client, interaction as any as ButtonInteraction, Item as ItemBase)
        }

        if (interaction.customId == 'inv-select-more') {
            if (!interaction.isStringSelectMenu()) return

            const FieldName = interaction.message.embeds[0].fields.find(({ name }) => name.includes(interaction.values[0]))

            const CountInputEmbed = (Counts: string[]) => new EmbedBuilder()
                .setTitle(`${interaction.message.embeds[0].title?.split('`')[0]}`)
                .setDescription(`╰⬇️🔢เลือกย้ายไอเทมไปช่องรอง (จำนวนมาก)`)
                .addFields({
                    name: `${FieldName?.name}`,
                    value: `❓ระบุจำนวนที่ต้องการย้ายไปช่องรอง\n${codeBlock(`${NumberWithCommas(parseInt(Counts.toString().replace(/,/g, '')))} ชิ้น`)}`
                })

            const CountArr: string[] = []

            const CountMessage = await interaction.editReply({
                embeds: [CountInputEmbed(CountArr)],
                components: [...NumberInput(true)]
            })

            const CountInput = async (CountMessage: Message | undefined): Promise<boolean | undefined> => {
                const interaction = await CountMessage?.awaitMessageComponent({
                    filter: (inter) => inter.user.id == this.UserId,
                    time: 60_000
                })

                if (!interaction) return false
                if (!interaction.isButton()) return false

                await interaction.deferUpdate()

                if (interaction.customId == 'delete') {
                    CountArr.pop()

                    interaction.editReply({ embeds: [CountInputEmbed(CountArr)] })

                    return await CountInput(CountMessage)
                }

                if (interaction.customId == 'confirm') return true

                if (interaction.customId == 'back') return false

                if (interaction.customId == '000') {
                    CountArr.push('0')
                    CountArr.push('0')
                    CountArr.push('0')
                }

                const Number = parseInt(interaction.customId)

                if (isNaN(Number)) return false

                CountArr.push(interaction.customId)

                interaction.editReply({ embeds: [CountInputEmbed(CountArr)] })

                return await CountInput(CountMessage)
            }

            const isEnd = await CountInput(CountMessage)

            if (isEnd == true) {
                const Select = new Map<string, boolean>()

                for (let select of isSelect) {
                    if (!Select.has(select.ItemId)) Select.set(select.ItemId, true)
                }

                const Count = CountArr.length == 0 ? 0 : parseInt(CountArr.toString().replace(/,/g, ''))
                const ItemId = interaction.values[0]

                if (Select.size == 25 && !Select.has(ItemId)) return console.log(`${interaction.user.id} เลือกไอเทมเกิน 25 ชนิด`)

                await Promise.all(new Array(Count).fill(1).map(async () =>
                    await this.client.Database.Inventorys.updateOne({
                        $or: [
                            { UserId: this.UserId, ItemId, Select: false },
                            { UserId: this.UserId, ItemId, Select: { $exists: false } },
                        ]
                    }, { $set: { Select: true } })
                ))
            }

            await interaction.editReply(await this.Render())
        }
    }

    private async PageItemDetail(isSelect: ItemBase[], interaction: ButtonInteraction | StringSelectMenuInteraction) {
        if (interaction.customId.includes('Details')) {
            if (!interaction.isButton()) return

            if (interaction.customId.includes('back')) {
                this.State = 'Items'
            } else {
                const [cat, ItemId, pageNo] = interaction.customId.split('-')

                this.ItemPageNo = parseInt(pageNo)
            }

            await interaction.editReply(await this.Render())
        }

        if (interaction.customId.includes('inv-select')) {
            if (!interaction.isStringSelectMenu()) return

            const Select = new Map<string, boolean>()

            for (let select of isSelect) {
                if (!Select.has(select.ItemId)) Select.set(select.ItemId, true)
            }

            await Promise.all(interaction.values.map(async (ItemFullId) => {
                const [ItemId, ItemDate, ItemCount] = ItemFullId.split('-')

                if (Select.size == 25 && !Select.has(ItemId)) return console.log(`${interaction.user.id} เลือกไอเทมเกิน 25 ชนิด`)

                await this.client.Database.Inventorys.updateOne({
                    UserId: this.UserId,
                    ItemId,
                    ItemDate,
                    ItemCount: parseInt(ItemCount)
                }, {
                    $set: { Select: true }
                })
            }))

            await interaction.editReply(await this.Render())
        }

        if (interaction.customId == 'UnSelect') {
            if (!interaction.isStringSelectMenu()) return

            if (isSelect.length <= 25) {
                await Promise.all(interaction.values.map(async (ItemFullId) => {
                    const [ItemId, ItemDate, ItemCount] = ItemFullId.split('-')

                    await this.client.Database.Inventorys.updateOne({
                        ItemId,
                        ItemDate,
                        ItemCount: parseInt(ItemCount)
                    }, {
                        $set: { Select: false }
                    })
                }))
            } else {
                await Promise.all(interaction.values.map(async (ItemId) =>
                    await this.client.Database.Inventorys.updateOne({
                        ItemId,
                        Select: true
                    }, {
                        $set: { Select: false }
                    }))
                )
            }

            await interaction.editReply(await this.Render())
        }
    }

    private async PageSelect(isSelect: ItemBase[], interaction: ButtonInteraction | StringSelectMenuInteraction) {
        if (interaction.isButton()) this.ButtonExec(interaction, isSelect)

        if (interaction.customId.includes('unSelect')) {
            if (!interaction.isStringSelectMenu()) return

            const FieldName = interaction.message.embeds[0].fields.find(({ name }) => name.includes(interaction.values[0]))

            const CountInputEmbed = (Counts: string[]) => new EmbedBuilder()
                .setTitle(`💼 ช่องเก็บไอเทมรอง`)
                .setDescription(`╰ \`⬆️🔢เลือกย้ายไอเทมไปช่องหลัก (จำนวนมาก)\``)
                .addFields({
                    name: `${FieldName?.name}`,
                    value: `❓ระบุจำนวนที่ต้องการย้ายไปช่องหลัก\n${codeBlock(`${NumberWithCommas(parseInt(Counts.toString().replace(/,/g, '')))} ชิ้น`)}`
                })

            const CountArr: string[] = []

            const CountMessage = await interaction.editReply({
                embeds: [CountInputEmbed(CountArr)],
                components: [...NumberInput(true)]
            })

            const CountInput = async (CountMessage: Message | undefined): Promise<boolean | undefined> => {
                const interaction = await CountMessage?.awaitMessageComponent({
                    filter: (inter) => inter.user.id == this.UserId,
                    time: 60_000
                })

                if (!interaction) return false
                if (!interaction.isButton()) return false

                await interaction.deferUpdate()

                if (interaction.customId == 'delete') {
                    CountArr.pop()

                    interaction.editReply({ embeds: [CountInputEmbed(CountArr)] })

                    return await CountInput(CountMessage)
                }

                if (interaction.customId == 'confirm') return true

                if (interaction.customId == 'back') return false

                const Number = parseInt(interaction.customId)

                if (isNaN(Number)) return false

                CountArr.push(interaction.customId)

                interaction.editReply({ embeds: [CountInputEmbed(CountArr)] })

                return await CountInput(CountMessage)
            }

            const isEnd = await CountInput(CountMessage)

            if (isEnd == true) {
                const Select = new Map<string, boolean>()

                for (let select of isSelect) {
                    if (!Select.has(select.ItemId)) Select.set(select.ItemId, true)
                }

                const Count = parseInt(CountArr.toString().replace(/,/g, ''))
                const ItemId = interaction.values[0]

                if (Select.size == 25 && !Select.has(ItemId)) return console.log(`${interaction.user.id} เลือกไอเทมเกิน 25 ชนิด`)

                await Promise.all(new Array(Count).fill(1).map(async () =>
                    await this.client.Database.Inventorys.updateOne({ UserId: this.UserId, ItemId, Select: true }, { $set: { Select: false } })
                ))
            }

            await interaction.editReply(await this.Render())
        }

        if (interaction.customId.includes('manage-item')) {
            if (!interaction.isStringSelectMenu()) return

            const ActionInteraction = interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`💼 ช่องเก็บไอเทมรอง`)
                        .setDescription(`╰\`✅เลือกจัดการไอเทมจากช่องรอง\``)
                        .addFields(await InventoryBuild(this.client, isSelect.filter(Item => Item.ItemId == interaction.values[0])))
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('back')
                                .setLabel(`↩ย้อนกลับ`)
                                .setStyle(ButtonStyle.Secondary),

                            new ButtonBuilder()
                                .setCustomId('back')
                                .setLabel(`⬅ก่อนหน้า`)
                                .setStyle(ButtonStyle.Primary),

                            new ButtonBuilder()
                                .setCustomId('back')
                                .setLabel(`หน้าถัดไป➡`)
                                .setStyle(ButtonStyle.Primary),

                            new ButtonBuilder()
                                .setCustomId('move-all')
                                .setLabel(`⬆ย้ายทั้งหมด⬆`)
                                .setStyle(ButtonStyle.Success),
                        )
                ]
            })
        }
    }

    private async ButtonExec(interaction: ButtonInteraction, isSelect: ItemBase[]) {
        if (interaction.customId.includes('use')) return Use(this.client, interaction, isSelect[0])

        if (interaction.customId.includes('give')) return Give(this.client, interaction, isSelect)

        if (interaction.customId.includes('sell')) return Sell(this.client, interaction, isSelect)

        if (interaction.customId.includes('trade')) return Trade(this.client, interaction, isSelect)

        if (interaction.customId.includes('place')) return Place(this.client, interaction, isSelect)

        if (interaction.customId.includes('info')) {
            // const Info = await InfoExecute(this.client, this.UserId, interaction.customId.split('-')[1])

            // return interaction.editReply({ ...Info, components: [] })
        }

        if (interaction.customId.includes('move-all')) {
            const Embed = interaction.message.embeds[0]

            const InteractionMessage = await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❓ยืนยันการย้ายไอเทมจากช่องรอง ไปช่องหลักทั้งหมดหรือไม่')
                        .setFields(Embed.fields)
                ], components: [
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel(`✅ยืนยัน✅`)
                                .setCustomId('confirm')
                                .setStyle(ButtonStyle.Success),

                            new ButtonBuilder()
                                .setLabel(`❌ยกเลิก❌`)
                                .setCustomId('cancel')
                                .setStyle(ButtonStyle.Danger),
                        )
                ]
            })

            const Responseinteraction = await InteractionMessage.awaitMessageComponent({
                filter: (interaction) => interaction.user.id == this.UserId ? true : this.client.config.OnwerIds.includes(interaction.user.id),
                time: 300_000,
            }).catch(() => { })

            if (!Responseinteraction) return

            if (!Responseinteraction.isButton()) return

            if (Responseinteraction.customId == 'confirm') {
                await this.client.Database.Inventorys.updateMany({ UserId: this.UserId, Select: true }, { $set: { Select: false } })
            }

            Responseinteraction.deleteReply()

            return
        }

        if (interaction.customId.includes('destroy')) return Destroy(this.client, interaction, isSelect)

        if (interaction.customId.includes('refresh')) await interaction.editReply(await this.Render())
    }
}