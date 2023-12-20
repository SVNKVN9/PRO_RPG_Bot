import Client from "../../structure/Client";
import fs from 'fs'
import path from 'path'
import command from "../../types/command";

export default class Command {
    constructor(client: Client) {
        const commandDirs = fs.readdirSync(path.join(__dirname, '..', '../commands'))
        for(const commandDir of commandDirs) {

            const commandFiles = fs.readdirSync(path.join(__dirname, '..', '../commands', commandDir))
            for(const commandFile of commandFiles) {
                const File = require(`../../commands/${commandDir}/${commandFile}`)
                const command: command = File.default
    
                client.commands.set(command.name, command)
                if (command.aliases && command.aliases.length) command.aliases.forEach(alias => client.aliases.set(alias, command.name))
            
                console.log(`Command | ${commandDir} | ${command.name} Loaded`)
            }
        }
    }
}