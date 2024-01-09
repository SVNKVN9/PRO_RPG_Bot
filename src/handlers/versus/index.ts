import { ButtonInteraction, Collection, CommandInteraction, GuildMember, Message, StringSelectMenuInteraction, VoiceState } from "discord.js";
import Client from "../../structure/Client";
import { EquipPos, ItemEquip, ItemParameter, ItemsType, StatusType } from "../../types";
import { EventEmitter } from 'events'
import Render from "./Render";

enum EventType {
    Update = 'VersusUpdate'
}

export class Versus extends EventEmitter {
    private UserId: string
    private LastUpdate: number
    private ChannelId: string
    private Escape: Collection<string, number>
    private UserTarget: string | undefined
    private Render: Render

    constructor(private client: Client, private interaction: CommandInteraction, ChannelId: string) {
        super()
        this.UserId = interaction.user.id
        this.LastUpdate = Date.now()
        this.ChannelId = ChannelId
        this.Escape = new Collection()
        this.Render = new Render(this.client, this.UserId, this.interaction)

        this.client.on('voiceStateUpdate', this.TargetUpdate.bind(this))

        this.client.VersusManager.on(EventType.Update, async (ChannelId) => {
            if (ChannelId != this.ChannelId) return

            this.interaction.editReply(await this.Render.Display(this.Escape))
        })

        this.on(EventType.Update, async () => this.interaction.editReply(await this.Render.Display(this.Escape)))
    }

    private async TargetUpdate(oldState: VoiceState, newState: VoiceState) {
        if (oldState.channelId == newState.channelId) return
        if (newState.id == this.UserId) return

        // Filter ignore Channel
        if (!newState.channelId && oldState.channelId != this.ChannelId) return
        if (!oldState.channelId && newState.channelId != this.ChannelId) return

        // Join and has Escape to delete
        if (newState.channelId == this.ChannelId) if (this.Escape.has(newState.id)) this.Escape.delete(newState.id)

        // Leave add to Escape
        if (oldState.channelId == this.ChannelId) this.Escape.set(newState.id, Date.now())

        const message: Message = await new Promise(async (res, rej) => Date.now() - this.LastUpdate < 2_000 ?
            setTimeout(async () => {
                this.LastUpdate = Date.now() + 2_000

                res(await this.interaction.editReply(await this.Render.Display(this.Escape)))
            }, 2_000) :

            res(await this.interaction.editReply(await this.Render.Display(this.Escape)))
        )

        if (Date.now() - this.LastUpdate < 2_000) {
            this.LastUpdate = Date.now() + 2_000

            setTimeout(async () => this.interaction.editReply(await this.Render.Display(this.Escape)), 2_000)
        } else this.interaction.editReply(await this.Render.Display(this.Escape))
    }

    public async start() {
        const message = await this.interaction.editReply(await this.Render.Display(this.Escape))

        this.awaitMessage(message)
    }

    private async awaitMessage(message: Message) {
        const interaction = await message.awaitMessageComponent({
            time: 3_600_000,
            filter: (inter) => inter.user.id == this.UserId
        }).catch(() => { })

        if (!interaction) return

        if (interaction.customId == 'select-user') {
            if (!interaction.isStringSelectMenu()) return

            if (this.UserTarget == interaction.values[0]) {
                this.UserTarget = undefined
                this.Render.setUserTarget(undefined)
            } else {
                this.UserTarget = interaction.values[0]
                this.Render.setUserTarget(interaction.values[0])
            }

            await interaction.deferUpdate()
        }

        const DefaultAttack = async (interaction: ButtonInteraction) => {
            await interaction.deferReply({ ephemeral: true })

            const Target = this.UserTarget ? await interaction.guild?.members.fetch(this.UserTarget) : undefined
            const Member = interaction.guild?.members.cache.get(interaction.user.id) || await interaction.guild?.members.fetch(interaction.user.id) as GuildMember

            if (Target?.voice.channelId != Member.voice.channelId) return interaction.editReply({ content: '❌ไม่ได้อยู่ในห้องเดียวกันกับเป้าหมาย' })

            await this.client.Attack.execute(Target, interaction)

            this.client.VersusManager.emit(EventType.Update, this.ChannelId)
        }

        const ItemAttack = async (interaction: StringSelectMenuInteraction) => {
            await interaction.deferReply({ ephemeral: true })

            const ItemId = interaction.values[0]
            const Target = this.UserTarget ? await interaction.guild?.members.fetch(this.UserTarget) : undefined
            const Member = interaction.guild?.members.cache.get(interaction.user.id) || await interaction.guild?.members.fetch(interaction.user.id) as GuildMember

            if (Target?.voice.channelId != Member.voice.channelId) return interaction.editReply({ content: '❌ไม่ได้อยู่ในห้องเดียวกันกับเป้าหมาย' })

            const Item = await this.client.Database.Items(ItemId) as ItemsType

            const Select = await this.client.Database.Equips.findOne({ UserId: this.UserId, ItemId }) as any as ItemEquip

            const command: {
                default: (ItemParameter: ItemParameter) => Promise<StatusType>
            } = require(`../Item/Type/${Item.Type == 'AB' ? 'ABExtend' : Item.Type}`)

            const Query = { UserId: this.UserId, ItemId, ItemDate: Select.ItemDate, ItemCount: Select.ItemCount }

            try {
                await this.client.Database.Inventorys.updateOne(Query, { $set: { Locked: true } })

                const result = await command.default({
                    client: this.client,
                    Member: Member,
                    ItemTarget: Select,
                    interaction: interaction as any,
                    Target,
                    AcceptCheck: false,
                })

                await this.client.Database.Inventorys.updateOne(Query, { $set: { Locked: false } })

                if (result.message) await interaction.editReply(result.message)
            } catch (err) {
                await this.client.Database.Inventorys.updateOne(Query, { $set: { Locked: false } })

                this.client.log.try_catch_Handling('🔴', `ItemExecute (${this.UserId} | ${ItemId}): ${err}`)

                await interaction.editReply({ content: `เกิดข้อผิดพลาด: ${err}` })
            }

            this.client.VersusManager.emit(EventType.Update, this.ChannelId)
        }

        if (interaction.isButton() && interaction.customId.split('-')[0] == 'attack') await DefaultAttack(interaction)

        if (interaction.isStringSelectMenu() && interaction.customId.split('-')[0] == 'attack') await ItemAttack(interaction) 

        if (interaction.isButton() && interaction.customId.split('-')[0] == 'selectType') {
            this.Render.setDisplayAttack(interaction.customId.split('-')[1])

            await interaction.deferUpdate()
        }

        if (interaction.isButton() && interaction.customId == 'attack-back') {
            this.Render.setDisplayAttack()

            await interaction.deferUpdate()
        }

        this.emit(EventType.Update)

        this.awaitMessage(message)
    }
}