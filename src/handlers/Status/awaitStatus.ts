import { ActionRowBuilder, ButtonInteraction, Message, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import Client from "../../structure/Client";
import { ButtonStats, SecondRow, SelectStats, StatusEmbed, StatusSelectMenu } from "./Rander";
import { ICooldown, ILevel, IUser, ItemEquip, TypeAB, TypeB, TypeP, TypePA, TypePD } from "../../types";
import { CreateId } from "../../Utils/Function";
import { ObjectID } from "bson";
import Pages from "./Pages";

export default async (client: Client, interaction: ButtonInteraction | StringSelectMenuInteraction) => {
    const UserId = interaction.user.id

    if (interaction.isButton()) {
        if (interaction.customId.includes('ButtonStats')) return ButtonStats(client, interaction)

        const PageNo = interaction.customId.split('-')[1]

        const User = await client.Database.Users.findOne({ UserId: UserId }) as IUser
        const Level: ILevel = await client.Database.Level.findOne({ LevelNo: User.stats.level.toString() }) as any

        const Equips: ItemEquip[] = await client.Database.Equips.find({ UserId: UserId }).toArray() as any
        const Effects: ItemEquip[] = await client.Database.Effect.find({ UserId: UserId }).toArray() as any
        const Cooldowns = await client.Database.Cooldowns.find({ UserId: UserId }).toArray() as any as ICooldown[]

        const Page = new Pages(User, Level, Equips, Effects, Cooldowns, client, interaction, parseInt(PageNo))

        const message = await Page.Render()

        if (!interaction.message.interaction) {
            interaction.deferUpdate()
            interaction.message.edit(message)
        }
        else interaction.update(message)
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId == 'SelectStats') return SelectStats(client, interaction)

        if (interaction.customId.includes('remove')) return RemoveItem(client, interaction)
    }
}

const RemoveItem = async (client: Client, interaction: StringSelectMenuInteraction) => {
    await interaction.deferUpdate()

    const UserId = interaction.user.id
    const ItemType = interaction.values[0]
    const Equips = await client.Database.Equips.find({ UserId: interaction.user.id }).toArray() as any as ItemEquip[]
    const Items = (await Promise.all(Equips.map(async ({ ItemId }) => await client.Database.Items(ItemId))))
        .filter((Item) => {
            const PassiveMe = (Item as TypeAB | TypeB).PassiveMe

            if (PassiveMe && PassiveMe.EquipPos == ItemType) return true

            const PassiveTarget = (Item as TypePA | TypeP | TypePD).PassiveTarget

            if (PassiveTarget && PassiveTarget.EquipPos == ItemType) return true

            return false
        })

    const NameFormat = (ItemData: any) => `${ItemData.Base.ItemId} ${ItemData.Base.EmojiId ? ItemData.Base.EmojiId : ''} ${ItemData.Base.ItemName}`

    const Id = CreateId(12)

    const SelectItem = new StringSelectMenuBuilder()
        .setPlaceholder(`เลือกไอเทมที่ต้องการถอด`)
        .setCustomId(Id)
        .addOptions(Items.map((Item, index) => ({
            label: `${index + 1}．${NameFormat(Item)}`,
            value: (Item as any).Base.ItemId
        })))

    if (!SelectItem.options.length) SelectItem.setPlaceholder('ไม่มีไอเทมที่สวมใส่อยู่').addOptions({ label: 'NONE', value: 'NONE' }).setDisabled(true)

    const components = [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(SelectItem)]

    let message: Message

    if (interaction.message.interaction) message = await interaction.editReply({ components })
    else message = await interaction.message.edit({ components })

    const RemoveInteraction = await message.awaitMessageComponent({
        time: 120_000,
        filter: (inter) => inter.customId == Id && inter.user.id == UserId
    }).catch(() => { })

    if (!RemoveInteraction) return
    if (!RemoveInteraction.isStringSelectMenu()) return

    await RemoveInteraction.deferUpdate()

    await Promise.all(RemoveInteraction.values.map(async (ItemId) => {
        const Item = await client.Database.Equips.findOne({ UserId, ItemId }) as ItemEquip

        await client.Database.Equips.deleteOne({ _id: new ObjectID(Item._id) }) as any as ItemEquip
        await client.Database.Inventorys.insertOne(Item)
    }))

    const { HGD, HGF } = await client.Utils.UpdateHG(UserId)
    const User = await client.Database.Users.findOne({ UserId }) as any as IUser

    return interaction.editReply({ embeds: [await StatusEmbed(client, User, HGD, HGF)], components: [StatusSelectMenu(UserId), SecondRow(UserId)] })
}