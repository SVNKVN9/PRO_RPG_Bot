import { Client } from "discord.js"
import fs from 'fs'
import path from 'path'

export default class Event {
    constructor(client: Client) {
        const eventFolders = fs.readdirSync(path.join(__dirname, '..', '../events'))
        for (let folder of eventFolders) {
            const eventFiles = fs.readdirSync(path.join(__dirname, '..', '../events', folder))
            for (const eventFile of eventFiles) {
                const File = require(`../../events/${folder}/${eventFile}`)
                const event: any = File.default

                if (folder == 'rest') {
                    client.rest.on(event.name, event.execute.bind(null, client))
                } else {
                    client.on(event.name, event.execute.bind(null, client))
                }

                console.log(`Event | ${folder} | ${event.name} Loaded`)
            }
        }
    }
}