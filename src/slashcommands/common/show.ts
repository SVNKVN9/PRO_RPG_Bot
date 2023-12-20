import { codeBlock, CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { ItemBase } from '../../types'
import Client from "../../structure/Client";
import { msToDHM } from "../../Utils/Function";
import { ErrorEmbeds } from '../../Utils/Components';

export default {
    data: [
        new SlashCommandBuilder()
            .setName('show')
            .setDescription('แสดงไอเทม')
            .addStringOption(option => option.setName('ไอเทมไอดี').setDescription('ไอเทมไอดี').setRequired(true))
            .addUserOption(option => option.setName('ผู้ใช้').setDescription('ผู้ใช้'))
    ],

    execute: async (client: Client, interaction: CommandInteraction) => {
        const ItemId = interaction.options.get('ไอเทมไอดี')?.value as string
        const User = interaction.options.get('ผู้ใช้')?.user

        await interaction.deferReply()
        setTimeout(() => interaction.deleteReply(), 250)

        const isItem: ItemBase[] = await client.Database.Inventorys.find({
            $or: [
                { UserId: interaction.user.id, ItemId: ItemId },
                {
                    UserId: interaction.user.id,
                    ItemId: ItemId.split('-')[0],
                    ItemDate: ItemId.split('-')[1],
                    ItemCount: parseInt(ItemId.split('-')[2])
                },
                {
                    UserId: interaction.user.id,
                    ItemId: ItemId.split('-')[0],
                    ItemDate: ItemId.split('-')[1],
                    ItemCount: ItemId.split('-')[2]
                },
            ]
        }).toArray() as any

        if (isItem.length < 0) return interaction.channel?.send({ content: '❌ ไม่พบไอเทมนี้ในกระเป๋าคุณ' })

        const ItemData = await client.Database.Items(isItem[0].ItemId) as any
        
        const now = Date.now()
        const Text = [`👁 คุณ <@${interaction.user.id}> มีไอเทม`, '']
        
        if (ItemId.includes('-')) {
            Text.push(`✅${ItemData.Base.ItemId}${ItemData.Base.EmojiId ? ItemData.Base.EmojiId : ''}${ItemData.Base.ItemName}`)
            Text.push(codeBlock('ml', `${ItemId} | ${msToDHM(now - isItem[0].CreateTimestramp)}`))
        } else {
            Text.push(`✅${ItemData.Base.ItemId}${ItemData.Base.EmojiId ? ItemData.Base.EmojiId : ''}${ItemData.Base.ItemName} \`(จำนวน ${isItem.length})\``)
        }

        const Embed = new EmbedBuilder()
        .setDescription(Text.join('\n'))
        .setTimestamp()
        
        if (User) {
            const Member = await interaction.guild?.members.fetch(interaction.user.id)
            const Target = await interaction.guild?.members.fetch(User.id)

            if (Member?.voice.channel != Target?.voice.channel) return interaction.channel?.send({ embeds: [ErrorEmbeds.ChannelNotMatch(Target?.user.id)] })

            const message = await User.send({ embeds: [Embed] })

            setTimeout(async () => await message.delete(), 30 * 1000)
        } else {
            const message = await interaction.channel?.send({ embeds: [Embed] })
            
            setTimeout(async () => await message?.delete(), 30 * 1000)
        }
    }
}