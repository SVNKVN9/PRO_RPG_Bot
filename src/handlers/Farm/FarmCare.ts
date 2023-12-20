import { ModalSubmitInteraction } from "discord.js";
import Client from "../../structure/Client";
import { CareType, FarmCare, FarmOptions, ICareItem, TypeF } from "../../types";
import { DHMStoSec } from "../../Utils/Function";

export default async (client: Client, interaction: ModalSubmitInteraction) => {
    const FarmId = interaction.customId.split("-")[1]
    const ItemId = interaction.fields.getTextInputValue('ItemId')
    const Count = parseInt(interaction.fields.getTextInputValue('Count'))

    if (isNaN(Count)) return interaction.reply({ ephemeral: true, content: 'ใส่จำนวนเป็นตัวเลขเท่านั้น' })

    const Farm: FarmOptions = await client.Database.Farm.findOne({ Id: FarmId }) as any

    if (!Farm) return interaction.reply({ ephemeral: true, content: 'ไม่พบฟาร์ม' })

    const hasItem = await client.Database.Inventorys.find({ UserId: interaction.user.id, ItemId: ItemId }).toArray()

    if (hasItem.length < Count) return interaction.reply({ ephemeral: true, content: 'คุณมีไอเทมเลี้ยงดูนี้ไม่เพียงพอ' })

    const ItemData = await client.Database.Items(Farm.ItemId) as TypeF

    const now = Date.now()

    const insertFarmCare = async (Items: ICareItem[] | undefined, type: CareType) => {
        if (!Items) return

        const Item = Items.find(item => item.ItemId == ItemId)

        if (!Item) return

        const Amount = parseInt(Item.Amount as string)

        if (isNaN(Amount)) return

        if (Item.Condition == '<=') if (Count < Amount) return
        if (Item.Condition == '==') if (Count != Amount) return
        if (Item.Condition == '>=') if (Count > Amount) return

        const isCare = await client.Database.FarmCare.findOne({ FarmId: Farm.Id, ItemId: ItemId, type: type }) as any as FarmCare

        if (!isCare) {
            return await client.Database.FarmCare.insertOne({
                FarmId: Farm.Id,
                ItemId: ItemId,
                type: type,
                EffectTimeout: now + (DHMStoSec(Item.EffectTime) * 1000),
                nextTime: now + (DHMStoSec(Item.CareTime) * 1000)
            })
        }

        if (isCare.nextTime > now) return

        await client.Database.FarmCare.updateOne({
            FarmId: Farm.Id,
            ItemId: ItemId,
            type: type
        }, {
            EffectTimeout: now + (DHMStoSec(Item.EffectTime) * 1000),
            nextTime: now + (DHMStoSec(Item.CareTime) * 1000)
        })
    }

    for (let FarmRandom of ItemData.FarmRandom) {
        const { Amount, Chance, Product } = FarmRandom

        if (Amount) insertFarmCare(Amount.CareItem, CareType.Amount)
        if (Chance) insertFarmCare(Chance.CareItem, CareType.Chance)
        if (Product) insertFarmCare(Product.CareItem, CareType.Product)
    }

    for (let i = 0; i < Count; i++) {
        client.Database.Inventorys.deleteOne({ UserId: interaction.user.id, ItemId: ItemId })
    }

    return interaction.reply({ ephemeral: true, content: '✅ เลี้ยงดูสำเสร็จ' })
}