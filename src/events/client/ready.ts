import { Collection, Guild } from "discord.js";
import { LevelCal } from "../../handlers/Level/LevelCal";
import Client from "../../structure/Client";
import AddMember from "../../Utils/AddMember";

export default {
    name: 'ready',
    execute: async (client: Client) => {
        console.log(`${client.user?.tag} is ready`)

        client.log.Sharding('🟢', `Shard ${client.shard?.ids} is ready`)

        const CreateUptimeMap = async (map: Collection<string | undefined, { uptime: number, guild: Guild }>) => {
            const guilds = client.guilds.cache.toJSON()

            for (let guild of guilds) {
                const channels = guild.channels.cache.toJSON()

                for (let channel of channels) {
                    if (!channel) continue
                    if (!channel.isVoiceBased()) continue

                    const members = channel.members.toJSON()

                    for (let member of members) {
                        if (!member) continue

                        await AddMember(client, member.id)

                        map.set(member.id, { uptime: Date.now(), guild: guild })

                        const isRole = member.roles.cache.find(role => role.name == 'จอมยุทธ์')

                        if (isRole) continue

                        const role = guild.roles.cache.find(role => role.name == 'จอมยุทธ์')

                        try {
                            if (role) member.roles.add(role)
                        } catch { }

                    }
                }
            }
        }

        const AutoSave = async () => {
            for (let [userId, value] of client.Connection.Uptime) await LevelCal(client, value.guild, userId as string)

            client.Connection.Uptime.clear()

            await CreateUptimeMap(client.Connection.Uptime)
        }

        setInterval(AutoSave, 1000 * 60 * 10)

        await CreateUptimeMap(client.Connection.Uptime)
    }
}