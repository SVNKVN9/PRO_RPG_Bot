import Client from "../../structure/Client";
import fs from 'fs'
import path from 'path'
import { REST, Routes } from "discord.js";
import { SlashCommand } from "../../types/command";

export default class SlashCommandHandler {
    public rest: REST
    public commands: any[] = []

    constructor(public client: Client) {
        this.rest = new REST({ version: '10' }).setToken(client.config.TOKEN)

        const commandDirs = fs.readdirSync(path.join(__dirname, '..', '../slashcommands'))
        for(const commandDir of commandDirs) {
            const commandFiles = fs.readdirSync(path.join(__dirname, '..', '../slashcommands', commandDir))
            for(const commandFile of commandFiles) {
                const File = require(`../../slashcommands/${commandDir}/${commandFile}`)
                const commands: SlashCommand = File.default
    
                this.commands = [ ...this.commands, ...commands.data.map(command => {
                    const cmd = command.toJSON()
                
                    client.slashcommands.set(cmd.name, commands)
                    console.log(`SlashCommand | ${commandDir} | ${cmd.name} Loaded`)

                    return cmd
                }) ]
            }
        }

        this.deploy()
    }

    public async deploy() {
        try {
            await this.rest.put(Routes.applicationCommands(this.client.config.CLIENT_ID), {
                body: this.commands
            })
        } catch (err) {
            this.client.log.try_catch_Handling("🔴", `Deploy SlashCommand Error: ${err}`)
        }
    }
}