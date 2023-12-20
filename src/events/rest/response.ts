import { APIRequest, RESTEvents } from "discord.js";
import Client from "../../structure/Client";

export default {
    name: RESTEvents.Response,
    execute: (client: Client, request: APIRequest, response: any) => {
        // console.log(request, response)

        // client.log.Debug('🟢', `Request: ${request.method} ${request.path} | Response: ${response.statusCode}`)
    }
}