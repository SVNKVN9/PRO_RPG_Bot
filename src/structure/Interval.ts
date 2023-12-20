import { TextChannel } from "discord.js";
import { FarmOptions, IUptimeLog, IUser } from "../types";
import Client from "./Client";

export default class Interval {
    constructor(public client: Client) {
        setInterval(() => this.FarmMessage(), 60_000) // every 1 min

        setInterval(() => {
            this.UptimeLogExpire()
        }, 1000 * 60 * 60 * 12) // every 12 hour 
    }

    async FarmMessage() {
        const Farms = await this.client.Database.Farm.find({}).toArray() as any as FarmOptions[]

        for (let Farm of Farms) {
            try {
                const now = Date.now()

                if (now < Farm.Timeout) continue

                await this.client.Database.Farm.deleteOne({ Id: Farm.Id })
                await this.client.Database.FarmUsers.deleteOne({ FarmId: Farm.Id })
                await this.client.Database.FarmChannels.updateOne({ Id: Farm.ChannelId }, { $pull: { FarmIds: Farm.Id } })

                const Channel = await this.client.channels.fetch(Farm.ChannelId) as TextChannel

                const message = Channel.messages.cache.get(Farm.MessageId) || await Channel.messages.fetch(Farm.MessageId)

                await message.delete()
            } catch { }
        }
    }

    async UptimeLogExpire() {
        const Logs = await this.client.Database.Uptime.find({}).toArray() as any as IUptimeLog[]
        const now = Date.now()

        const DeleteList: IUptimeLog[] = []

        for (let Log of Logs) {
            if (now < Log.Expire) continue

            DeleteList.push(Log)
        }

        if (!DeleteList.length) return

        await this.client.Database.Uptime.deleteMany(DeleteList)

        await Promise.all(DeleteList.map(async (Uptime) => this.client.Database.Uptime.deleteOne(Uptime)))
    }
}