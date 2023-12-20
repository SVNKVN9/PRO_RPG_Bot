import { InvalidRequestWarningData, RESTEvents } from "discord.js";
import Client from "../../structure/Client";

export default {
    name: RESTEvents.InvalidRequestWarning,
    execute: (client: Client, invalid: InvalidRequestWarningData) => {
        console.log(invalid)

        client.log.Debug('🔴', `Invalid: ${invalid}`)
    }
}