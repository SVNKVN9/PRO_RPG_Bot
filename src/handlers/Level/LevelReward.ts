import { ButtonInteraction, EmbedBuilder, codeBlock } from "discord.js"
import Client from "../../structure/Client"
import { ButtonMoney, ButtonRandom, ButtonReward, ButtonSelect, ButtonType, ILevel, IRandomItem, ItemBase } from "../../types"
import { NumberWithCommas } from "../../Utils/Function"
import GiveItem from '../../Utils/give'

export default async (client: Client, interaction: ButtonInteraction) => {
    const Button: ButtonMoney | ButtonRandom | ButtonSelect | ButtonReward = await client.Database.Buttons.findOne({ Id: interaction.customId }) as any

    if (!Button) return

    await interaction.deferUpdate()

    const User = await client.users.fetch(interaction.user.id)

    const dmChannel = await User.createDM()

    if (Button.Type == ButtonType.Money) {
        await client.Database.Users.updateOne({ UserId: interaction.user.id }, { $inc: { cash: Button.Amount } })

        await client.Database.Buttons.deleteOne({ Id: Button.Id })

        await dmChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`💰 จำนวน ${codeBlock('diff', `+${NumberWithCommas(Button.Amount)} แกน`)}`)
                    .setColor('Green')
                    .setTimestamp()
            ]
        })
    }

    if (Button.Type === ButtonType.Random) {
        const Level = await client.Database.Level.findOne({ LevelNo: Button.Level }) as any as ILevel
        let { RandomItem } = Level

        const ItemGive = new Map<string, number>()

        RandomItem = RandomItem.filter(Item => (Item.Maxcount - (Item.Counted ? Item.Counted : 0)) > 0)

        if (!RandomItem.length) return

        for (let i = 0; i < Button.Count; i++) {
            const expanded = RandomItem.flatMap(Item => Array(Item.Probability).fill(Item));
            const Item: IRandomItem = expanded[Math.floor(Math.random() * expanded.length)];

            if (ItemGive.has(Item.ItemId)) {
                ItemGive.set(Item.ItemId,
                    ItemGive.get(Item.ItemId) as number + (
                        Item.Maxcount < (Item.Counted + Item.Count) ?
                            Item.Maxcount - Item.Counted :
                            Item.Count
                    )
                )
            }
            else ItemGive.set(Item.ItemId, Item.Maxcount < (Item.Counted + Item.Count) ?
                Item.Maxcount - Item.Counted :
                Item.Count
            )

            if ((Item.Maxcount - (Item.Counted + (ItemGive.get(Item.ItemId) as number))) <= 0) RandomItem.splice(RandomItem.indexOf(Item), 1)
        }

        const AllItems: ItemBase[] = []

        for (let [ItemId, quantity] of ItemGive) {
            const Gived = await GiveItem(client, null, interaction.user.id, ItemId, quantity)

            for (let Item of Gived.data) AllItems.push(Item)

            await client.Database.Level.updateOne(
                { LevelNo: Button.Level, 'RandomItem.ItemId': ItemId },
                { $inc: { "RandomItem.$.Counted": quantity } }
            )
        }

        await client.Database.Buttons.deleteOne({ Id: Button.Id })
        const ItemList = AllItems.map((Item, index) => `${index + 1}. ${Item.ItemId}-${Item.ItemDate}-${Item.ItemCount}`)
        await dmChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`🎁 <@${client.user?.id}> ให้ไอเทมกับ <@${interaction.user.id}> สำเร็จ ✅\n\n${codeBlock('ml', `${ItemList.join('\n')}`)}`)
                    .setColor('White')
                    .setTimestamp()
            ]
        })
    }

    if (Button.Type === ButtonType.Select) {
        const AllButtons = interaction.message.components.map((row) => row.components.map(component => component.customId))
        let ButtonIds: any[] = []

        for (let i = 0; i < AllButtons.length; i++) ButtonIds = ButtonIds.concat(AllButtons[i])

        const Gived = await GiveItem(client, null, interaction.user.id, Button.ItemId, Button.Count)

        if (Button.Equip) {
            await Promise.all(Gived.data.map(async (Item) => await client.Database.Inventorys.deleteOne(Item)))

            await client.Database.Equips.insertMany(Gived.data)
        }

        await client.Database.Buttons.deleteMany({ Id: { $in: ButtonIds } })
    }

    if (Button.Type === ButtonType.Reward) {
        const Level = await client.Database.Level.findOne({ LevelNo: Button.Level }) as any as ILevel

        await Promise.all(Level.ItemReward.map(async Item => await GiveItem(client, null, interaction.user.id, Item.ItemId, Item.Count)))

        await client.Database.Buttons.deleteOne({ Id: Button.Id })
    }

    const message = await dmChannel.messages.fetch(interaction.message.id)

    await message.edit({ components: [] })
}