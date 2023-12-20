import { EmbedBuilder, codeBlock, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuInteraction, ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import Client from "../../structure/Client"
import { TypeF, CareType, FarmCare, FarmOptions } from "../../types"
import { DHMStoSec, msToDHM, msToDHMS, NumberWithCommas, ThaiZone } from "../../Utils/Function"

export const FarmMessage = async (client: Client, Item: TypeF, FarmId: string): Promise<any> => {
    const Farm = await client.Database.Farm.findOne({ Id: FarmId }) as any as FarmOptions
    const CareItems = await client.Database.FarmCare.find({ FarmId: FarmId }).toArray() as any as FarmCare[]

    const embeds: EmbedBuilder[] = []

    embeds.push(
        new EmbedBuilder()
            .setTitle(Item.FarmEmbed.Name ?? '')
            .setDescription(`
            ${Item.FarmEmbed.Description ?? ''}
            🔊**ห้องเสียงที่จำเป็นต้องเข้า**
            <#${Farm.VoiceId}>\n
            💚**พลังชีวิต**
            ${codeBlock(`${Item.FarmProperties.HP ? NumberWithCommas(parseInt(Item.FarmProperties.HP)) : '0'} HP`)}
            `)
            .setImage(Item.FarmEmbed.ImageURL as string)
    )

    for (let FarmRandom of Item.FarmRandom) {
        if (FarmRandom.DisableDescription) return

        const Item = await client.Database.Items(FarmRandom.ItemId)

        if (!Item) continue

        const ItemFarm = Farm.Items.find(Item => Item.ItemId == FarmRandom.ItemId)

        const TimeFormat = (Time: string | undefined) => msToDHM(DHMStoSec(Time) * 1000).split(' ').filter(value => parseInt(value) != 0).join(" ")

        const { Crop_User, Crop_Global, InTime_User, InTime_Global, Amount, Chance, Product } = FarmRandom

        const ItemCareAmount = CareItems.filter((Item) => Item.type == CareType.Amount)
        const ItemCareChance = CareItems.filter((Item) => Item.type == CareType.Chance)
        const ItemCareProduct = CareItems.filter((Item) => Item.type == CareType.Product)

        const CareAmount = Amount?.CareItem?.filter(Care => ItemCareAmount.map((care) => care.ItemId).includes(Care.ItemId as string))
        const CareChance = Chance?.CareItem?.filter(Care => ItemCareChance.map((care) => care.ItemId).includes(Care.ItemId as string))
        const CareProduct = Product?.CareItem?.filter(Care => ItemCareProduct.map((care) => care.ItemId).includes(Care.ItemId as string))

        const content: string[] = []
        const now = Date.now()

        if (now < (ItemFarm?.startTime as number)) content.push(`🎉เริ่มเก็บเกี่ยว ⌚${ThaiZone(ItemFarm?.startTime as number)}`)
        if (ItemFarm?.expireTime != 0) {
            if (now > (ItemFarm?.startTime as number)) content.push(`❌หมดเวลาเก็บเกี่ยว ⌚${ThaiZone(ItemFarm?.expireTime as number)}`)
        }

        content.push(`🙋‍♂️ได้ [${Crop_User}] ครั้ง/คน/${TimeFormat(InTime_User)}⌚`)
        content.push(`🌍ได้ [${parseInt(Crop_Global as string) - (ItemFarm?.CropPerTime as number)}/${Crop_Global}] ครั้ง/ทั้งหมด/[${TimeFormat(InTime_Global)}⌚${ThaiZone(ItemFarm?.resetTime as number)}]`)
        content.push(`💯จำนวนคงเหลือ ${(ItemFarm?.MaxCount as number) - (ItemFarm?.Counted as number)}`)

        content.push(`🔢จำนวนที่ได้【${Amount?.Amount ?? ''}】`)

        if (CareAmount) {
            for (let Care of CareAmount) {
                const AddOrSubtract = parseInt(Care.AddOrSubtract as string)
                const Timeout = ItemCareAmount.find((Item) => Item.ItemId == Care.ItemId)?.EffectTimeout

                content.push(`${AddOrSubtract > 0 ? `+${AddOrSubtract}` : `${AddOrSubtract}`} [${TimeFormat(Care.EffectTime)}⌚${ThaiZone(Timeout as number)}]`)
            }
        }

        content.push(`🎲โอกาสได้【${Chance?.Chance ?? ''}%】`)

        if (CareChance) {
            for (let Care of CareChance) {
                const AddOrSubtract = parseInt(Care.AddOrSubtract as string)
                const Timeout = ItemCareChance.find((Item) => Item.ItemId == Care.ItemId)?.EffectTimeout

                content.push(`${AddOrSubtract > 0 ? `+${AddOrSubtract}` : `${AddOrSubtract}`} [${TimeFormat(Care.EffectTime)}⌚${ThaiZone(Timeout as number)}]`)
            }
        }

        content.push(`⏰ออกผลผลิต【${TimeFormat(Product?.Product)}】`)

        if (CareProduct) {
            for (let Care of CareProduct) {
                const AddOrSubtract = parseInt(Care.AddOrSubtract as string)
                const Timeout = ItemCareProduct.find((Item) => Item.ItemId == Care.ItemId)?.EffectTimeout

                content.push(`${AddOrSubtract > 0 ? `+${AddOrSubtract}` : `${AddOrSubtract}`} [${TimeFormat(Care.EffectTime)}⌚${ThaiZone(Timeout as number)}]`)
            }
        }

        if (!embeds.length) {
            embeds.push(
                new EmbedBuilder()
                    .addFields({
                        name: `${Item.Base.ItemId} ${Item.Base.EmojiId ?? ''} ${Item.Base.ItemName}`,
                        value: `\`\`\`${content.join('\n')}\`\`\``
                    })
            )
        } else {
            const embed = embeds[embeds.length - 1]

            if ((embed.data.fields?.length as number) < 5) {
                embed.addFields({
                    name: `${Item.Base.ItemId} ${Item.Base.EmojiId ?? ''} ${Item.Base.ItemName}`,
                    value: `\`\`\`${content.join('\n')}\`\`\``
                })
            } else {
                embeds.push(
                    new EmbedBuilder()
                        .addFields({
                            name: `${Item.Base.ItemId} ${Item.Base.EmojiId ?? ''} ${Item.Base.ItemName}`,
                            value: `\`\`\`${content.join('\n')}\`\`\``
                        })
                )
            }
        }
    }

    let isCare = false

    for (let { Amount, Chance, Product } of Item.FarmRandom) {
        if (isCare) continue

        if (Amount?.CareItem?.length) isCare = true

        if (Chance?.CareItem?.length) isCare = true

        if (Product?.CareItem?.length) isCare = true
    }

    const components = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setLabel(`🤏เก็บเกี่ยว (${msToDHMS(DHMStoSec(Item.FarmCondition.Cooldown) * 1000).split(' ').filter(value => parseInt(value.slice(0, -1)) != 0).join(" ")})🤏`)
                .setCustomId(`farmgive-${FarmId}`)
                .setStyle(ButtonStyle.Success),
        )

    if (isCare) {
        components.addComponents(
            new ButtonBuilder()
                .setLabel('💦เลี้ยงดู💦')
                .setCustomId(`careshow-${FarmId}`)
                .setStyle(ButtonStyle.Primary)
        )
    }

    return {
        embeds,
        components: [components]
    }
}

export const ShowFarmInput = async (interaction: StringSelectMenuInteraction | ButtonInteraction) => {
    const model = new ModalBuilder()
        .setCustomId(`farmcare-${interaction.customId.split('-')[1]}`)
        .setTitle('ใส่ไอเทมเลี้ยงดู')
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>()
                .addComponents(
                    new TextInputBuilder()
                        .setCustomId('ItemId')
                        .setLabel('ไอเทมไอดี')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
            new ActionRowBuilder<TextInputBuilder>()
                .addComponents(
                    new TextInputBuilder()
                        .setCustomId('Count')
                        .setLabel('จำนวน')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
        )

    await interaction.showModal(model)
}