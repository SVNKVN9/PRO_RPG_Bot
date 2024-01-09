import { ButtonInteraction, Collection, CommandInteraction, EmbedBuilder, Interaction, StringSelectMenuInteraction } from "discord.js";
import FarmCare from "../../handlers/Farm/FarmCare";
import { FarmExecute } from "../../handlers/Farm/FarmExecute";
import { ShowFarmInput } from "../../handlers/Farm/FarmMessage";
import Client from "../../structure/Client";
import { IUser } from "../../types";
import AddMember from "../../Utils/AddMember";
import LevelReward from "../../handlers/Level/LevelReward";
import { GetItemPlace } from "../../handlers/inventory/Place";
import awaitStatus from "../../handlers/Status/awaitStatus";

export default {
    name: 'interactionCreate',
    execute: async (client: Client, interaction: Interaction) => {
        await AddMember(client, interaction.user.id)

        if (interaction.isModalSubmit() || interaction.isChatInputCommand() || interaction.isStringSelectMenu()) {
            const suspend = await isSuspend(client, interaction.user.id)

            if (suspend) return interaction.reply({ ephemeral: true, content: '❌ คุณถูกระงับบัญชีอยู่' })
        }

        if (interaction.isChatInputCommand()) return executeComamnd(client, interaction)

        if (interaction.isButton() || interaction.isStringSelectMenu()) {
            if (interaction.customId.includes('place')) GetItemPlace(client, interaction)

            if (interaction.customId.includes('Stats')) return awaitStatus(client, interaction)

            if (interaction.customId.includes('careshow')) return ShowFarmInput(interaction)

            if (interaction.customId.includes('birthpoint')) return SaveBirthPoint(client, interaction)

            // if (interaction.customId.includes('delete')) return DeleteItem(client, interaction)

            if (interaction.customId.includes('farmgive')) return FarmExecute(client, interaction)

            if (interaction.isButton()) return LevelReward(client, interaction)
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId.includes('farmcare')) return FarmCare(client, interaction)
        }
    }
}

const isSuspend = async (client: Client, UserId: string) => {
    const User = await client.Database.Users.findOne({ UserId: UserId }) as any as IUser

    return User.suspend
}

const executeComamnd = async (client: Client, interaction: CommandInteraction) => {
    const { commandName } = interaction

    const command = client.slashcommands.get(commandName)

    if (!command) return

    if (!client.cooldowns.has(commandName)) {
        client.cooldowns.set(commandName, new Collection())
    }

    const now = Date.now()
    const timestamps = client.cooldowns.get(commandName)
    const defaultCooldown = Math.floor(Math.random() * (5 - 3 + 1) + 3)
    const cooldownAmount = defaultCooldown * 1000

    if (timestamps?.has(interaction.user.id)) {
        const expirationTime = (timestamps?.get(interaction.user.id) as number) + cooldownAmount;

        if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1000);
            return interaction.reply({ content: `คุณใช้คำสั่ง \`${commandName}\` เร็วเกินไปโปรดรอ <t:${expiredTimestamp}:R>.`, ephemeral: true });
        }
    }

    timestamps?.set(interaction.user.id, now);
    setTimeout(() => timestamps?.delete(interaction.user.id), cooldownAmount);

    try {
        // client.log.ExecutedCommand("🟢", `Command: ${commandName} Executed by <@${interaction.user.id}> (${interaction.user.id})`)

        command.execute(client, interaction)
    } catch (err) {
        client.log.ExecutedCommand("🔴", `execute command Error: ${err} <@${interaction.user.id}> (${interaction.user.id})`)
    }
}

const SaveBirthPoint = async (client: Client, interaction: ButtonInteraction | StringSelectMenuInteraction) => {
    if (!interaction.isButton()) return

    await interaction.deferReply({ ephemeral: true })

    const [birthpoint, BirthPointId] = interaction.customId.split('-')

    await client.Database.Users.updateOne({ UserId: interaction.user.id }, { $set: { birthpoint: BirthPointId } })

    for (let guild of client.guilds.cache.toJSON()) {
        try {
            const isMember = guild.members.cache.get(interaction.user.id) || await guild.members.fetch(interaction.user.id)

            if (guild.id == interaction.guild?.id) continue
            if (client.config.Servers.includes(guild.id)) return

            isMember.kick()
        } catch { }
    }

    return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`✅ คุณได้เซฟจุดเกิดแล้ว`)] })
}