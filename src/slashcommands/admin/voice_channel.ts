import { CommandInteraction } from "discord.js";
import Client from "../../structure/Client";
import { SimpleVoice, PermissionVoice, InviteVoice } from "../../handlers/Connection/Create";
import Command from '../../handlers/Connection/Structure'
import Info from "../../handlers/Connection/Info";

export default {
    data: [Command],
    execute: async (client: Client, interaction: CommandInteraction) => {
        const { options } = interaction

        const Command = options.data[0].name

        if (
            Command == 'assign-role' ||
            Command == 'remove-role' ||
            Command == 'toggle-role'
        )  return SimpleVoice(client, interaction)

        if (Command == 'invite') return InviteVoice(client, interaction)

        if (Command.includes('view-channel')) return PermissionVoice(client, interaction)

        if (Command === 'delete') {
            const actionId = options.get('actionid')?.value as string

            const isActionId = await client.Database.RoleVoice.findOne({ ActionId: actionId })

            if (!isActionId) return interaction.reply({ content: `**ไม่พบ action id ${actionId}**` })

            await client.Database.RoleVoice.deleteOne({ ActionId: actionId })

            return interaction.reply({ content: `**ลบ action id ${actionId} แล้ว**` })
        }

        if (Command === 'info') return Info(client, interaction)
    }
}