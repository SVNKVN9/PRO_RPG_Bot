import { ButtonInteraction, GuildMember, EmbedBuilder, StringSelectMenuInteraction } from "discord.js"
import Client from "../../structure/Client"
import { FarmOptions, IUser, TypeF, FarmUser, FarmCare, CareType } from "../../types"
import { Captcha } from "../../Utils/Captcha"
import { DHMStoSec } from "../../Utils/Function"
import GiveItem from "../../Utils/give"
import FarmCondition from "./FarmCondition"
import { FarmMessage } from "./FarmMessage"

export const FarmExecute = async (client: Client, interaction: ButtonInteraction | StringSelectMenuInteraction) => {
    const Farm: FarmOptions = await client.Database.Farm.findOne({ Id: interaction.customId.split('-')[1] }) as any

    if (!Farm) return

    const User: IUser = await client.Database.Users.findOne({ UserId: interaction.user.id }) as any
    const Member = await interaction.guild?.members.fetch(interaction.user.id) as GuildMember
    const Item: TypeF = await client.Database.Items(Farm.ItemId) as any

    if (Member.voice.channelId != Farm.VoiceId) return interaction.reply({ ephemeral: true, embeds: [new EmbedBuilder().setDescription(`คุณไม่ได้อยู่ห้อง <#${Farm.VoiceId}>`).setColor('Red')] })

    // Check FarmCondition
    const Condition = await FarmCondition(client, User, Member, Item)

    if (Condition.isEnd) {
        await interaction.reply({ ephemeral: true, content: Condition.message?.content })

        if (!Condition.edit) return

        setTimeout(() => {
            try {
                interaction.editReply({ content: Condition.edit?.message.content })
            } catch (err) { /* anti Invalid Wehbooh Error when close Message */ }
        }, Condition.edit.timeout)
        return
    }

    // Verify  Captcha
    const isPass = await Captcha(client, interaction as ButtonInteraction)

    if (!isPass) {
        const isPass = await Captcha(client, interaction as ButtonInteraction)

        if (!isPass) return interaction.editReply({ content: '❌ โปรดลองใหม่ภายหลัง' })
    }

    // Filter CareItems
    const now = Date.now()

    const { FarmRandom } = Item
    const RawCareItems = await client.Database.FarmCare.find({ FarmId: Farm.Id }).toArray() as any as FarmCare[]

    RawCareItems.forEach((Item) => {
        if (now < Item.EffectTimeout) return

        client.Database.FarmCare.deleteOne(Item)
    })

    const ItemCares = RawCareItems.filter((Item) => now < Item.EffectTimeout)
    const ItemsReady = Farm.Items.filter(Item =>
        now > Item.startTime &&
        (Item.expireTime == 0 || now < Item.expireTime) &&
        Item.Counted < Item.MaxCount
    ).map(Item => Item.ItemId)

    // Calcurate CareItems
    const ChanceRate = FarmRandom.filter(FarmRandom => ItemsReady.includes(FarmRandom.ItemId as string))
        .map(Farmrandom => {
            const { ItemId, Chance } = Farmrandom

            const FarmItem = FarmRandom.find(FarmRandom => FarmRandom.ItemId == ItemId)

            if (!FarmItem) return {
                ItemId,
                Chance: parseFloat(Chance?.Chance as string)
            }

            const isCare = FarmItem.Chance?.CareItem?.find((Item) =>

                ItemCares.filter(Item => Item.type == CareType.Chance

                ).map(Item => Item.ItemId).includes(Item.ItemId as string))

            if (!isCare) return {
                ItemId,
                Chance: parseFloat(Chance?.Chance as string)
            }

            return {
                ItemId: ItemId,
                Chance: parseFloat(Chance?.Chance as string) + parseFloat(isCare.AddOrSubtract as string)
            }
        })
        .map((Item) => ({ ...Item, Chance: Item.Chance * 10 }))

    // Select Function and Random ItemId
    const totalChance = ChanceRate.reduce((p, c) => p + c.Chance, 0)
    let ItemId = ''

    if (totalChance > 1000) {
        const List = ChanceRate.map((Item) => {
            const RandomRate = (100 / ChanceRate.reduce((p, c) => p + c.Chance, 0)) * Item.Chance

            return {
                ItemId: Item.ItemId,
                Chance: parseInt(
                    (
                        RandomRate.toFixed(1).replace('.', '')
                    ).toString()
                )
            }
        })

        const ItemList = List.flatMap(Item => Array(Item.Chance).fill(Item.ItemId))

        const RandomList = ItemList.concat(Array(1000 - ItemList.length).fill('None'))

        ItemId = RandomList[Math.floor(Math.random() * RandomList.length)]
    } else {
        const ItemList = ChanceRate.flatMap(Item => Array(Item.Chance).fill(Item.ItemId))

        const RandomList = ItemList.concat(Array(1000 - ItemList.length).fill('None'))

        ItemId = RandomList[Math.floor(Math.random() * RandomList.length)]
    }

    // Random ItemId
    if (ItemId == 'None') {
        const channel = interaction.channel

        if (!channel?.isTextBased()) return

        const msg = await channel.send({ content: `❌ <@${interaction.user.id}> ไม่ได้ไอเทม` })

        setTimeout(() => msg?.delete(), 5000)

        return
    }

    // Check User UsedLimit
    const isUser = await client.Database.FarmUsers.findOne({
        UserId: User.UserId,
        FarmId: Farm.Id,
        ItemId: ItemId
    }) as any as FarmUser

    if (!isUser) {
        const ms = DHMStoSec(FarmRandom.find(Item => Item.ItemId == ItemId)?.InTime_User) * 1000

        await client.Database.FarmUsers.insertOne({
            UserId: User.UserId,
            FarmId: Farm.Id,
            ItemId: ItemId,
            Counted: 1,
            Timeout: now + ms
        })
    } else {
        const ItemFarm = FarmRandom.find((value) => value.ItemId == ItemId)

        if (now < isUser.Timeout) {
            if (isUser.Counted >= parseInt(ItemFarm?.Crop_User as string)) {
                const channel = interaction.channel

                if (!channel?.isTextBased()) return

                const msg = await channel.send({ content: `<@${interaction.user.id}> **จำนวนที่ได้ / คน หมดแล้ว** โปรดมาใหม่ในภายหลัง` })

                setTimeout(() => msg?.delete(), 5000)

                return
            }

            await client.Database.FarmUsers.updateOne({
                UserId: User.UserId,
                FarmId: Farm.Id,
                ItemId: ItemId,
            }, {
                $inc: {
                    Counted: 1
                }
            })
        } else {
            await client.Database.FarmUsers.updateOne({
                UserId: User.UserId,
                FarmId: Farm.Id,
                ItemId: ItemId
            }, {
                $set: {
                    Counted: 1,
                    Timeout: now + (DHMStoSec(ItemFarm?.InTime_User) * 1000)
                }
            })
        }
    }

    // Check Global UsedLimit
    const FarmDetail = Farm.Items.find((detail) => detail.ItemId == ItemId)
    const ItemFarm = FarmRandom.find((value) => value.ItemId == ItemId)

    if (!FarmDetail) return interaction.editReply({ content: '❌ Error cannot fount ItemId' })

    if (now < FarmDetail.resetTime) {
        if (FarmDetail.CropPerTime >= parseInt(ItemFarm?.Crop_Global as string)) {
            const channel = interaction.channel

            if (!channel?.isTextBased()) return

            const msg = await channel.send({ content: `<@${interaction.user.id}> **จำนวนที่ได้ / ทั้งหมด หมดแล้ว**โปรดมาใหม่ภายหลัง` })

            setTimeout(() => msg?.delete(), 5000)

            return
        }
    } else {
        await client.Database.Farm.updateOne({
            Id: Farm.Id,
            "Items.ItemId": ItemId
        }, {
            $set: {
                "Items.$.CropPerTime": 0,
                "Items.$.resetTime": now + (DHMStoSec(ItemFarm?.InTime_Global) * 1000)
            }
        })
    }

    // Random ItemCount
    const result = FarmRandom.find(Item => Item.ItemId == ItemId)

    const Amount = result?.Amount
    const BaseAmount = parseInt(Amount?.Amount as string)
    const DynamicAmount = parseInt(Amount?.AddOrSubtract as string)

    const [Min, Max] = [BaseAmount, BaseAmount + (DynamicAmount ? DynamicAmount : 0)].sort((a, b) => a - b)

    const FindAddOrSubtract = () => {
        if (!result) return 0

        if (!result.Amount) return 0

        const { Amount } = result

        if (!Amount.CareItem) return 0

        const { CareItem } = Amount

        const isCare = CareItem.find(Item => ItemCares.filter(Item => Item.type == CareType.Amount).map(Item => Item.ItemId).includes(Item.ItemId as string))

        if (!isCare) return 0

        return parseInt(isCare.AddOrSubtract as string)
    }

    let GiveCount = Math.floor(Math.random() * (Max - Min + 1) + Min) + FindAddOrSubtract()

    if (GiveCount == 0) {
        const msg = await interaction.channel?.send({ content: `❌ <@${interaction.user.id}> ไม่ได้ไอเทม` })

        setTimeout(() => msg?.delete(), 5000)

        return
    }

    // Check Maximum
    const MaxCount = FarmDetail.MaxCount
    const Counted = FarmDetail.Counted

    if (Counted as number + GiveCount > MaxCount) {
        GiveCount = MaxCount ? MaxCount : 0 - Counted
    }

    // Update DB
    await client.Database.Farm.updateOne({
        Id: Farm.Id,
        "Items.ItemId": ItemId
    }, {
        $inc: {
            "Items.$.Counted": GiveCount,
            "Items.$.CropPerTime": 1
        }
    })

    // Send Done Message
    const Gived = await GiveItem(client, null, interaction.user.id, ItemId, GiveCount)

    const msg = await interaction.channel?.send(Gived.Message)

    setTimeout(() => msg?.delete(), 5000)

    try {
        await interaction.user.send(Gived.Message)
    } catch { }
    // Edit MessageFarm

    const MessageOption = await FarmMessage(client, Item, Farm.Id)

    interaction.message.edit(MessageOption)

    return
}