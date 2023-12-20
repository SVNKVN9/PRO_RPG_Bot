import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, ModalBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import Client from "../../structure/Client";
import { CreateId } from "../../Utils/Function";
import { InventoryBuild } from "../../Utils/Components";
import { ItemBase } from "../../types";

export default async (client: Client, interaction: ButtonInteraction, Select: ItemBase[]) => {
    const Password = await interaction.editReply({
        embeds: [
            new EmbedBuilder()
                .setTitle(`🔢 คุณต้องการใส่รหัสผ่านตอนเก็บไอเทมหรือไม่ 📦`)
                .addFields(await InventoryBuild(client, Select))
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('isPass')
                        .setLabel('✅ใส่รหัสผ่าน')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('noPass')
                        .setLabel('❌ไม่ใส่รหัสผ่าน')
                        .setStyle(ButtonStyle.Danger)
                )
        ]
    })

    const PassInteraction = await Password.awaitMessageComponent({
        filter: (inter) => inter.user.id == interaction.user.id,
        time: 60_000,
    }).catch(() => { })

    if (!PassInteraction) return
    if (!PassInteraction.isButton()) return

    let Id = CreateId(16)

    if (PassInteraction.customId == 'isPass') {
        const TextInput = new TextInputBuilder()
            .setCustomId('password')
            .setLabel('ใส่รหัสผ่าน')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)

        const InputRow = new ActionRowBuilder<TextInputBuilder>()
            .addComponents(TextInput)

        const Modal = new ModalBuilder()
            .setTitle('ใส่รหัสผ่าน')
            .setCustomId('box')
            .addComponents(InputRow)

        await PassInteraction.showModal(Modal)

        const ModalPassword = await PassInteraction.awaitModalSubmit({
            filter: (inter) => inter.user.id == PassInteraction.user.id,
            time: 300_000
        }).catch(() => { })

        if (!ModalPassword) return

        await ModalPassword.deferUpdate()

        const password = ModalPassword.fields.getTextInputValue('password')

        Id = `${Id}-${password}`
    }

    await client.Database.Inventorys.updateMany(
        {
            UserId: interaction.user.id,
            Select: true
        },
        {
            $set: {
                UserId: Id,
                Select: false
            }
        }
    )

    await interaction.deleteReply()

    await interaction.channel?.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('📦ไอเทม')
                .addFields(await InventoryBuild(client, Select))
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`place-${Id}`)
                        .setLabel(`🤏เก็บไอเทม🤏`)
                        .setStyle(ButtonStyle.Success)
                )
        ]
    })
}

export const GetItemPlace = async (client: Client, interaction: ButtonInteraction | StringSelectMenuInteraction) => {
    if (!interaction.isButton()) return

    const customId = interaction.customId.split('-')
    let Id = customId[1]
    const password = customId[2]

    if (!Id) return

    if (password) {
        await interaction.showModal(
            new ModalBuilder()
                .setTitle('ใส่รหัสผ่าน')
                .setCustomId('box')
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('password')
                                .setLabel('ใส่รหัสผ่าน')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        )
                )
        )

        const ModalPassword = await interaction.awaitModalSubmit({
            filter: (inter) => inter.user.id == interaction.user.id,
            time: 300_000
        }).catch(() => { })

        if (!ModalPassword) return

        await ModalPassword.deferReply({ ephemeral: true })

        const InputPassword = ModalPassword.fields.getTextInputValue('password')

        if (password != InputPassword) return ModalPassword.editReply({ content: '**❌ รหัสผ่านไม่ถูกต้อง**' })
        else await ModalPassword.deleteReply()

        Id = `${Id}-${password}`
    }
    else await interaction.deferUpdate()

    const result = await client.Database.Inventorys.updateMany({ UserId: Id }, {
        $set: {
            UserId: interaction.user.id
        }
    })

    if (result.matchedCount == 0) return interaction.channel?.send({
        embeds: [
            new EmbedBuilder()
                .setDescription(`<@${interaction.user.id}> ผู้เล่นคนอื่นเก็บไอเทมไปแล้ว❌`)
        ]
    }).then(message => setTimeout(() => message.delete(), 10_000))

    await interaction.message.delete()

    return interaction.channel?.send({
        embeds: [
            new EmbedBuilder()
                .setDescription(`<@${interaction.user.id}>🤏เก็บไอเทมสำเร็จ✅`)
        ]
    })
}