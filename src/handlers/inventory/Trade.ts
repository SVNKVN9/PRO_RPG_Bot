import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Collection, EmbedBuilder, GuildMember, codeBlock } from "discord.js";
import Client from "../../structure/Client";
import { InventoryBuild } from "../../Utils/Components";
import { ILevel, IUser, ItemBase } from "../../types";
import Calculator from "../../Utils/Calculator";
import SelectUser from "./SelectUser";

export default async (client: Client, interaction: ButtonInteraction, Select: ItemBase[]) => {
    const Member = await interaction.guild?.members.fetch(interaction.user.id)

    const InventoryFields = await InventoryBuild(client, Select)

    const TargetId = await SelectUser({
        interaction,
        Member: Member as GuildMember,
        InventoryFields,
        Embed: new EmbedBuilder()
            .setTitle('🔁 เลือกคนที่ต้องการแลกเปลี่ยน 🔁'),
        deleteInteraction: true
    })

    if (!TargetId) return

    const TargetItemSelect = await client.Database.Inventorys.find({ UserId: TargetId, Select: true }).toArray() as any as ItemBase[]

    if (!TargetItemSelect.length) return interaction.channel?.send({
        embeds: [
            new EmbedBuilder()
                .setDescription(`❌🔁 ไม่สามารถทำการแลกเปลี่ยนได้ เนื่องจากคุณ <@${TargetId}> ไม่ได้เลือกไอเทมไว้ในช่องรอง`)
                .setColor('Red')
        ]
    })

    const Target = await interaction.guild?.members.fetch(TargetId)
    const TargetInventoryFields = await InventoryBuild(client, TargetItemSelect)

    let MemberAccept = false
    let TargetAccept = false

    const VerifyAccept = (isAccept: boolean) => isAccept ? '✅ยอมรับการแลกเปลี่ยน' : '🟧รอการตรวจสอบ'

    const BaseTradeEmbed = () => [
        new EmbedBuilder()
            .setTitle(`1️⃣ ไอเทมของผู้แลก`)
            .setColor(13241594)
            .setDescription(`<@${Member?.id}>`)
            .addFields(InventoryFields)
            .setAuthor({ name: Member?.user.username as string, iconURL: Member?.displayAvatarURL() }),

        new EmbedBuilder()
            .setTitle(`2️⃣ ไอเทมของผู้รับแลก`)
            .setColor(13241594)
            .setDescription(`<@${TargetId}>`)
            .addFields(TargetInventoryFields)
            .setAuthor({ name: Target?.user.username as string, iconURL: Target?.displayAvatarURL() })
    ]

    const AcceptEmbed = (MemberAccept: boolean, TargetAccept: boolean) => [
        new EmbedBuilder()
            .setTitle(`🔁 ตรวจสอบเพื่อยืนยันการแลกเปลี่ยนไอเทม 🔁`)
            .setColor(13241594)
            .setDescription(`1️⃣ ผู้แลก <@${Member?.id}> ${codeBlock(VerifyAccept(MemberAccept))}2️⃣ ผู้รับแลก <@${TargetId}> ${codeBlock(VerifyAccept(TargetAccept))}`),

        ...BaseTradeEmbed()
    ]

    const message = await interaction.channel?.send({
        embeds: AcceptEmbed(MemberAccept, TargetAccept),
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept')
                        .setLabel('✅ยอมรับ✅')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('unaccept')
                        .setLabel('❌ไม่ยอมรับ❌')
                        .setStyle(ButtonStyle.Danger)
                )
        ]
    })

    const awaitAccept = async (): Promise<boolean | void> => {
        const AcceptAction = await message?.awaitMessageComponent({
            filter: (interaction) => interaction.user.id == Member?.id || interaction.user.id == TargetId,
            time: 60_000
        }).catch(() => { })

        if (!AcceptAction) return
        if (!AcceptAction.isButton()) return

        await AcceptAction.deferUpdate()

        if (AcceptAction.customId == 'accept') {
            if (AcceptAction.user.id == Member?.id) MemberAccept = true
            else TargetAccept = true

            if (MemberAccept && TargetAccept) return true
        }
        else return false

        message?.edit({ embeds: AcceptEmbed(MemberAccept, TargetAccept) })

        return awaitAccept()
    }

    const isAccept = await awaitAccept()

    if (isAccept == false) return message?.edit({
        embeds: [
            new EmbedBuilder()
                .setDescription(`❌🔁 ไม่สามารถทำการแลกเปลี่ยนได้ เนื่องจากคุณ <@${(MemberAccept && !TargetAccept) ? TargetId : Member?.id}> ไม่ยอมรับ`)
                .setColor('Red')
        ]
    })

    const MemberInventory = await client.Database.Inventorys.find({ UserId: Member?.id }).toArray() as any as ItemBase[]
    const TargetInventory = await client.Database.Inventorys.find({ UserId: Target?.id }).toArray() as any as ItemBase[]

    try {
        const ItemCache = new Collection<string, number>()

        const CapacityCheck = async (Items: ItemBase[]): Promise<number> => {
            const ItemMap = new Collection<string, number>()

            for (const { ItemId } of Items) {
                if (ItemMap.has(ItemId)) ItemMap.set(ItemId, ItemMap.get(ItemId) as number + 1)
                else ItemMap.set(ItemId, 1)
            }

            let TotalCP = 0

            for (let [ItemId, Count] of ItemMap) {
                if (ItemCache.has(ItemId)) TotalCP = TotalCP + (ItemCache.get(ItemId) as number * Count)
                else {
                    const Item = await client.Database.Items(ItemId) as any
                    const Size = Item.Base.Size ? parseInt(Item.Base.Size) : 1

                    ItemCache.set(ItemId, Size)

                    TotalCP = TotalCP + (Size * Count)
                }
            }

            return TotalCP
        }

        const CapacityVerify = async (UserId: string, Inventory: ItemBase[], ItemInput: ItemBase[], ItemTarget: ItemBase[]): Promise<boolean> => {
            const User = await client.Database.Users.findOne({ UserId }) as any as IUser
            const Level = await client.Database.Level.findOne({ LevelNo: User.stats.level.toString() }) as any as ILevel

            const { CP } = await Calculator(client, User as IUser, Level as ILevel)

            const CP_send = await CapacityCheck(ItemTarget)
            const CP_revice = await CapacityCheck(ItemInput)

            const TotelCP = await CapacityCheck(Inventory)

            if (((TotelCP + CP_revice) - CP_send) > CP) return false
            else return true
        }

        const MemberisPass = await CapacityVerify(Member?.id as string, MemberInventory, TargetItemSelect, Select)

        if (!MemberisPass) return message?.edit({ content: `❌ ${Member} คุณมีพื้นที่เก็บไม่เพียงพอ` })

        const TargetisPass = await CapacityVerify(Target?.id as string, TargetInventory, Select, TargetItemSelect)

        if (!TargetisPass) return message?.edit({ content: `❌ ${Target} คุณมีพื้นที่เก็บไม่เพียงพอ` })

        await Promise.all([
            await Promise.all(Select.map(
                async item => await client.Database.Inventorys.updateOne(
                    { UserId: Member?.id, ItemId: item.ItemId, ItemDate: item.ItemDate, ItemCount: item.ItemCount },
                    { $set: { UserId: Target?.id, Select: false } }
                )
            )),
            await Promise.all(TargetItemSelect.map(
                async item => await client.Database.Inventorys.updateOne(
                    { UserId: Target?.id, ItemId: item.ItemId, ItemDate: item.ItemDate, ItemCount: item.ItemCount },
                    { $set: { UserId: Member?.id, Select: false } }
                )
            ))
        ])

        return message?.edit({
            embeds: [
                new EmbedBuilder()
                    .setTitle('✅ การแลกเปลี่ยนไอเทมสำเร็จ 🔁')
                    .setColor(13241594),

                ...BaseTradeEmbed()
            ],
            components: []
        })
    } catch (err) {
        message?.edit({ content: `**เกิดข้อผิดพลาด** ${err}` })
    }
}