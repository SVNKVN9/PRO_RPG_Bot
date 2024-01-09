import { GuildMember, Role } from "discord.js";
import Client from "../../structure/Client";
import { IUser } from "../../types";

export default {
    name: 'guildMemberAdd',
    execute: async (client: Client, member: GuildMember) => {
        if (member.user.bot) return

        if (client.config.Servers.includes(member.guild.id)) return
        if (client.config.OnwerIds.includes(member.id)) return

        const user = await client.Database.Users.findOne({ UserId: member.id }) as any as IUser

        if (!user) return

        if (!user.alive) {
            await client.Database.Users.updateOne({ UserId: member.id }, { $set: { alive: true } })
            return
        }

        const invite = await client.Database.Invites.findOne({
            toGuildId: member.guild.id,
            userId: member.id
        }) as any

        if (!invite && user) {
            const Guild = await client.Database.Guilds(invite.fromGuildId)

            if (!Guild.KickWhenMove) return

            return member.kick()
        }

        if (!invite) return

        const DM = await member.createDM()

        const messages = await DM.messages.fetch({ limit: 100, cache: false })

        for (let message of messages.toJSON()) {
            if (!message.content.includes('https://discord.gg/')) continue

            message.delete()
        }

        try {
            if (!client.config.Servers.includes(invite.fromGuildId)) {
                const oldGuild = client.guilds.cache.get(invite.fromGuildId)

                const oldMember = await oldGuild?.members.fetch(member.id)

                const Guild = await client.Database.Guilds(invite.fromGuildId)

                if (!Guild.KickWhenMove) return

                await oldMember?.kick();
            }
        } catch (err) {
            console.log(err)
        }

        try {
            const role = member.guild.roles.cache.get(invite.roleId) as Role

            await member.roles.add(role)
        } catch (err) {
            console.log(err)
        }

        client.Database.Invites.deleteOne(invite)
    }
}