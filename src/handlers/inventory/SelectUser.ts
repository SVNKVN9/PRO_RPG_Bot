import { ActionRowBuilder, ButtonInteraction, EmbedBuilder, EmbedField, GuildMember, InteractionType, StringSelectMenuBuilder } from "discord.js"

interface SelectParameter {
    interaction: ButtonInteraction
    Member: GuildMember
    Embed: EmbedBuilder,
    InventoryFields?: EmbedField[]
    deleteInteraction?: boolean
}

export default async ({ interaction, Member, InventoryFields, Embed, deleteInteraction }: SelectParameter): Promise<string | undefined> => {
    const SelectUserMenu = new StringSelectMenuBuilder()
        .setPlaceholder('👤เลือกคนที่เป็นเป่าหมาย')
        .setCustomId('user-select')
        .setMinValues(1)
        .setMaxValues(1)

    Member.voice.channel?.members.forEach((member) => {
        if (member.user.bot) return
        if (member.id == Member.id) return

        SelectUserMenu.addOptions({
            label: `${member.user.username} (${member.user.tag})`,
            value: `${member.id}`
        })
    })

    if (!SelectUserMenu.options.length) {
        SelectUserMenu.setDisabled(true).addOptions({
            label: `UserNotFound`,
            value: 'cancel'
        })
    }

    InventoryFields ? Embed.addFields(InventoryFields) : ''

    const SelectUserMessage = await interaction.editReply({
        embeds: [Embed],
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(SelectUserMenu)
        ]
    })

    const SelectUser = await SelectUserMessage.awaitMessageComponent({
        filter: (interaction) => interaction.user.id == Member?.id,
        time: 30_000
    }).catch(() => {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder().setTitle('หมดเวลาเลือกผู้ขาย')
            ],
            components: []
        })
    })

    // Filter SelectInteraction
    if (SelectUser.type != InteractionType.MessageComponent) return

    await SelectUser.deferUpdate()

    if (!SelectUser.isStringSelectMenu()) return
    if (SelectUser.customId != 'user-select') return

    if (deleteInteraction) await SelectUser.deleteReply()

    return SelectUser.values[0]
}