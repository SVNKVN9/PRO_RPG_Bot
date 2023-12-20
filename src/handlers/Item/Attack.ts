import { CommandInteraction, GuildMember, MessageCreateOptions, TextBasedChannel } from "discord.js"
import { ILevel, IUser } from '../../types'
import Client from "../../structure/Client"
import Calculator from "../../Utils/Calculator"
import { NumberWithCommas } from "../../Utils/Function"

export default class Attack {
    private Cooldown: Map<string, { Timeout: number, CooldownSec: number }>

    constructor(public client: Client) {
        this.Cooldown = new Map()
    }

    async sendMessage(channel: TextBasedChannel | null, Target: GuildMember, messageOptions: MessageCreateOptions) {
        if (!channel) return

        const messages = await Promise.all([
            await channel.send(messageOptions),
            await Target.send(messageOptions)
        ])

        setTimeout(async () => messages.forEach(message => message.delete()), 10_000)
    }

    async execute(Target: GuildMember | undefined, interaction: CommandInteraction) {
        if (!Target) return interaction.editReply({ content: '❌ กรุณาระบุเป้าหมาย' })

        const now = Date.now()
        const isMap = this.Cooldown.get(interaction.user.id)

        if (isMap) {
            if (now < isMap.Timeout) return interaction.editReply({ content: `⚠คุณจะสามารถใช้คำสั่ง \`att\` นับถอยหลังในอีก ⏳<t:${(Math.round(isMap.Timeout / 1000))}:R>` })
            else this.Cooldown.delete(interaction.user.id)
        }

        const user = await this.client.Database.Users.findOne({ UserId: interaction.user.id }) as any as IUser
        const level = await this.client.Database.Level.findOne({ LevelNo: user.stats.level.toString() }) as any as ILevel

        const target = await this.client.Database.Users.findOne({ UserId: Target.user.id }) as any as IUser
        const targetLevel = await this.client.Database.Level.findOne({ LevelNo: target.stats.level.toString() }) as any as ILevel

        // const { DM, SPt } = await Calculator(this.client, user, level)
        // const { AM, EV } = await Calculator(this.client, target, targetLevel)

        // const max = (100 / 100) * DM
        // const min = (70 / 100) * DM
        // const random = Math.floor(Math.random() * (max - min + 1) + min)

        // const cooldown = now + (SPt * 1000)

        // this.Cooldown.set(interaction.user.id, { Timeout: cooldown, CooldownSec: SPt })
        // setTimeout(() => {
        //     interaction.editReply({ content: '🟢 Cool Down เสร็จสิ้น' })
        //     this.Cooldown.delete(interaction.user.id)
        // }, (SPt * 1000))

        const TagFormat = `🔴<@${interaction.user.id}> 👊โจมตี <@${Target.id}>`
        // const CooldownFormat = `⏳Cool Down <t:${Math.round((now / 1000) + SPt)}:R>`

        // const expanded: { hit: boolean, Probability: number }[] = [{ hit: true, Probability: EV }, { hit: false, Probability: 100 - EV }].flatMap(hit => Array(hit.Probability).fill(hit))
        // const randomHit = expanded[Math.floor(Math.random() * expanded.length)]

        // await interaction.editReply({ content: CooldownFormat })

        // if (randomHit.hit) return this.sendMessage(interaction.channel, Target, { content: `${TagFormat} 🤸ไม่โดน` })

        // if (random < AM) return this.sendMessage(interaction.channel, Target, { content: `${TagFormat} 🛡ไม่เข้า` })

        // await this.client.Database.Users.updateOne({ UserId: Target.user.id }, { $inc: { 'stats.HP.value': -(random) } })

        await this.client.Utils.CheckHPisZero(Target.guild, Target.user.id)

        const messageOptions: MessageCreateOptions = {}

        // if (random < 10) messageOptions.content = `${TagFormat} เข้า ${random / 100} 🩸HP`
        // else messageOptions.content = `${TagFormat} เข้า ${NumberWithCommas(random)} 🩸HP`

        this.sendMessage(interaction.channel, Target, messageOptions)
    }
}