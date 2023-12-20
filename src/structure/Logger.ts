import { WebhookClient, setPosition } from "discord.js"
import { WebHook } from "../types/config"
import Client from "./Client"
import os from 'os-utils'

type SendStatus = '🟢' | '🟡' | '🔴'

export default class Logger {
    public client: Client
    public WebHookURLs: WebHook

    private _ErrorHandling: WebhookClient
    private _ExecutedCommand: WebhookClient
    private _try_catch_Handling: WebhookClient
    private _Sharding: WebhookClient
    private _Debug: WebhookClient

    constructor(client: Client) {
        this.client = client
        this.WebHookURLs = client.config.WebHook

        this._ErrorHandling = new WebhookClient({ url: this.WebHookURLs.ErrorHandling })
        this._ExecutedCommand = new WebhookClient({ url: this.WebHookURLs.ExecutedCommand })
        this._try_catch_Handling = new WebhookClient({ url: this.WebHookURLs.try_catch_Handling })
        this._Sharding = new WebhookClient({ url: this.WebHookURLs.Sharding })
        this._Debug = new WebhookClient({ url: this.WebHookURLs.Debug })

        // setInterval(() => this.UsageReport(), 1000 * 10)
    }

    private UsageReport = () => {

    }

    private GetDate = () => new Date().toString().split(" ", 5).join(" ")
    private sendFormat = (status: SendStatus, message: string | unknown) => `${status} | ${message} \`At ${this.GetDate()}\``

    public ErrorHandling = (status: SendStatus, message: string | unknown) => {
        this._ErrorHandling.send({ content: this.sendFormat(status, message) })
    }

    public ExecutedCommand = (status: SendStatus, message: string | unknown) => {
        this._ExecutedCommand.send({ content: this.sendFormat(status, message) })
    }

    public try_catch_Handling = (status: SendStatus, message: string | unknown) => {
        console.log(message)
        
        this._try_catch_Handling.send({ content: this.sendFormat(status, message) })
    }

    public Sharding = (status: SendStatus, message: string | unknown) => {
        this._Sharding.send({ content: this.sendFormat(status, message) })
    }

    public Debug = (status: SendStatus, message: string | unknown) => {
        this._Debug.send({ content: this.sendFormat(status, message) })
    }
}