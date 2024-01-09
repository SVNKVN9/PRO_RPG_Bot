import { Client, GatewayIntentBits, Collection, Partials } from "discord.js";
import Command from "../handlers/Loader/Command";
import Event from "../handlers/Loader/Event";
import command, { SlashCommand } from "../types/command";
import { config } from "../types/config";
import Utils from "./Utils";
import Executer from "../handlers/Item/Executer";
import SlashCommandHandler from "../handlers/Loader/SlashCommand";
import Database from "./Database";
import Logger from "./Logger";
import Attack from "../handlers/Item/Attack";
import Interval from "./Interval";
import Connection from "./Connection";
import VersusManager from "./VersusManager";

export default class extends Client {
    public processing: number

    public config: config

    public commands: Collection<string, command>
    public aliases: Collection<string, string>
    public slashcommands: Collection<string, SlashCommand>
    public cooldowns: Collection<string, Collection<string, number>>

    public Comand: Command
    public Event: Event
    public SlashCommand: SlashCommandHandler

    public Connection: Connection
    public Database: Database
    public Interval: Interval
    public Executer: Executer
    public Attack: Attack
    public Utils: Utils
    public log: Logger
    public VersusManager: VersusManager

    constructor() {
        super({
            intents: [
                // GatewayIntentBits.DirectMessageReactions,
                // GatewayIntentBits.DirectMessageTyping,
                // GatewayIntentBits.DirectMessages,
                // GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildIntegrations,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildMembers,
                // GatewayIntentBits.GuildMessageReactions,
                // GatewayIntentBits.GuildMessageTyping,
                // GatewayIntentBits.GuildMessages,
                // GatewayIntentBits.GuildPresences,
                // GatewayIntentBits.GuildScheduledEvents,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildWebhooks,
                GatewayIntentBits.Guilds,
                // GatewayIntentBits.MessageContent,
            ],
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.GuildScheduledEvent,
                // Partials.Message,
                Partials.Reaction,
                Partials.ThreadMember,
                Partials.User,
            ]
        })

        this.processing = 0

        this.config = require('../../config.json')

        this.commands = new Collection()
        this.aliases = new Collection()
        this.slashcommands = new Collection()
        this.cooldowns = new Collection()

        this.Comand = new Command(this)
        this.Event = new Event(this)
        this.SlashCommand = new SlashCommandHandler(this)

        this.Connection = new Connection(this)
        this.Database = new Database(this, this.config.MongoURL, this.config.DBName)
        this.Interval = new Interval(this)
        this.Executer = new Executer(this)
        this.Attack = new Attack(this)
        this.Utils = new Utils(this)
        this.log = new Logger(this)
        this.VersusManager = new VersusManager()
    }

    async start() {
        super.login(this.config.TOKEN)
    }

    public async restart() {
        await super.destroy()

        await this.start()
    }

}