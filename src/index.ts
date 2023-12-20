import { ShardingManager, WebhookClient } from "discord.js";
import path from 'path'
import { config } from './types/config'

const config = require('../config.json') as config

const Manager = new ShardingManager(path.join(__dirname, 'bot.js'), {
    token: config.TOKEN,
    respawn: true,
    totalShards: 'auto',
})
const Logger = new WebhookClient({ url: config.WebHook.Sharding })

const DateFormat = () => `**[Sharding]** [${new Date().toString().split(" ", 5).join(" ")}]`

Manager.on('shardCreate', (shard) => {
    const msg = `${DateFormat()} Main System Launched shard (${shard.id})`
    Logger.send({ content: msg })

    shard.on('ready', () => {
        const msg = `${DateFormat()} Shard (${shard.id}) is ready`
        Logger.send({ content: msg })
    })

    shard.on("death", (process) => {
        const msg = (`${DateFormat()} Shard (${shard.id}) closed unexpectedly!`);
        Logger.send({ content: msg })
    });

    shard.on("disconnect", () => {
        const msg = (`${DateFormat()} Shard (${shard.id}) disconnected. Dumping socket close event...`);
        Logger.send({ content: msg })
    });

    shard.on("reconnecting", () => {
        const msg = (`${DateFormat()} Shard (${shard.id}) is reconnecting...`);
        Logger.send({ content: msg })
    });

    shard.on('error', (error) => {
        const msg = (`${DateFormat()} Shard (${shard.id}) is ${error}`);
        Logger.send({ content: msg })
    });
})

process.on('uncaughtException', (err) => {
    Logger.send({ content: `[Error] ${err}` })
})

Manager.spawn()