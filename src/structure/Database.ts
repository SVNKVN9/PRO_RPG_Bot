import { MongoClient, Db, Collection, CommandFailedEvent, CommandStartedEvent, CommandSucceededEvent } from "mongodb";
import User from "./Database/User";
import Inventory from "./Database/Inventory";
import Guild from "./Database/Guild";
import Client from "./Client";
import HTTPClient, { APIRoutes } from "../Utils/HTTPClient";
import { TypeAB, TypeB, TypeF, TypeP, TypePA, TypePD } from "../types";

export default class Database {
    public connection!: Db

    private MongoURL: string
    private DBName: string

    private QueueLog: any[]

    public Buttons!: Collection
    public BirthPoint!: Collection
    public Cooldowns!: Collection
    public CooldownUse!: Collection
    // public Groups!: Collection
    // public Items!: Collection
    public Invites!: Collection
    public Level!: Collection
    public Logger!: Collection
    public QueryLogging!: Collection
    // public Users!: Collection
    public Users!: User
    public Inventorys!: Collection
    // public Inventorys!: Inventory
    public Equips!: Collection
    // public Passive!: Collection
    public Walk!: Collection
    public RoleVoice!: Collection
    public Guilds!: Guild
    public Uptime!: Collection
    public Backup!: Collection
    public Farm!: Collection
    public FarmUsers!: Collection
    public FarmChannels!: Collection
    public FarmCooldowns!: Collection
    public FarmCare!: Collection

    private HTTPClient: HTTPClient

    constructor(private client: Client, mongoURL: string, DBName: string) {
        this.MongoURL = mongoURL
        this.DBName = DBName

        this.HTTPClient = new HTTPClient()

        this.QueueLog = []

        this.login()
    }

    private async login() {
        this.connection = await this.connect()
        this.getCollections()

        this.SaveLogging()
    }

    private async connect() {
        const client = new MongoClient(this.MongoURL, { minPoolSize: 5, maxPoolSize: 20, monitorCommands: true })

        await client.connect()

        client.on('commandStarted', this.onCommandStarted.bind(this));
        client.on('commandSucceeded', this.onCommandSucceeded.bind(this));

        console.log('Connected Database')

        return client.db(this.DBName)
    }

    public async Items (ItemId?: string): Promise<TypeAB | TypeB | TypePA | TypeP | TypePD | TypeF | undefined> {
        return await this.HTTPClient.request('GET', APIRoutes.FetchItems(ItemId))
    }

    public async Groups (GroupId?: string): Promise<{ Id: string, Name: string, Index: number }[]> {
        return await this.HTTPClient.request('GET', APIRoutes.FetchGroups(GroupId))
    }
    
    private getCollections() {
        const { connection } = this

        this.Buttons = connection.collection('buttons')
        this.BirthPoint = connection.collection('birth-points')
        this.Cooldowns = connection.collection('cooldowns')
        this.CooldownUse = connection.collection('cooldown-use')
        // this.Groups = connection.collection('groups')
        // this.Items = connection.collection('items')
        // this.Items = this.HTTPClient.request(APIRoutes.FetchItems())
        this.Invites = connection.collection('invites')
        this.Level = connection.collection('levels')
        this.Logger = connection.collection('logger')
        this.QueryLogging = connection.collection('query-logging')
        // this.Users = connection.collection('users')
        this.Users = new User(connection.collection('users'), this.client)
        this.Inventorys = connection.collection('inventorys')
        // this.Inventorys = new Inventory(connection.collection('inventorys'))
        this.Equips = connection.collection('equips')
        // this.Passive = connection.collection('passives')
        this.Walk = connection.collection('walk')
        this.RoleVoice = connection.collection('rolevoices')
        // this.Guilds = connection.collection('guilds')
        this.Guilds = new Guild(connection.collection('guilds'))
        this.Uptime = connection.collection('uptimelogs')
        this.Backup = connection.collection('backup')
        this.Farm = connection.collection('farms')
        this.FarmUsers = connection.collection('farmusers')
        this.FarmChannels = connection.collection('farmchannels')
        this.FarmCooldowns = connection.collection('farmcooldowns')
        this.FarmCare = connection.collection('farmcare')
    }

    private onCommandStarted(event: CommandStartedEvent) {
        if (event.command.find == 'query-logging') return
        if (event.command.insert == 'query-logging') return
        if (event.commandName == 'find') return

        // 2629800000
        this.QueueLog.push({
            query: event,
            successed: false,
            createdAt: new Date(),
            expireAt: new Date(Date.now() + 10_000)
        })
    }

    private onCommandSucceeded(event: CommandSucceededEvent) {
        const index = this.QueueLog.findIndex((value) => value.query.requestId == event.requestId)

        if (index == -1) return

        this.QueueLog[index].successed = true
        this.QueueLog[index].successedAt = new Date()
    }

    private async SaveLogging() {
        setInterval(async () => {
            this.QueryLogging.deleteMany({ successedAt: { $lte: new Date(Date.now() - 2_592_000_000) } })

            if (!this.QueueLog.length) return

            const insert = this.QueueLog.filter(value => value.successed)

            this.QueueLog = this.QueueLog.filter(value => !value.successed)

            if (!insert.length) return

            this.QueryLogging.insertMany(insert)
        }, 20_000)
    }
}