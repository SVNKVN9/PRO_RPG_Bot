import { codeBlock, RateLimitData, RESTEvents } from "discord.js";
import Client from "../../structure/Client";

export default {
    name: RESTEvents.RateLimited,
    execute: (client: Client, info: RateLimitData) => {
        console.log(info)

        client.log.Debug('🔴', `${codeBlock(`TimeToReset: ${info.timeToReset}\nLimit: ${info.limit}\nmethod: ${info.method}\nhash: ${info.hash}\nurl: ${info.url}\nroute: ${info.route}\nmajorParameter:  ${info.majorParameter}\nglobal: ${info.global}`)}`)
    }
}