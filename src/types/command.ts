import { CommandInteraction, Message, SlashCommandBuilder } from 'discord.js'
import Client from "../structure/Client"

export default interface command {
    name: string
    aliases?: string[]
    DMchat?: boolean
    execute: (client: Client, message: Message, args: string[], commandName?: string) => void
}

export interface SlashCommand {
    data: SlashCommandBuilder[]
    execute: (client: Client, interaction: CommandInteraction) => void
}