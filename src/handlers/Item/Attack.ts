import { ButtonInteraction, GuildMember, MessageCreateOptions, StringSelectMenuInteraction, TextBasedChannel } from "discord.js"
import { ILevel, IUser } from '../../types'
import Client from "../../structure/Client"
import Calculator from "../../Utils/Calculator"
import { NumberWithCommas } from "../../Utils/Function"

export default class Attack {
    private Cooldown: Map<string, { Timeout: number, CooldownSec: number }>

    constructor(public client: Client) {
        this.Cooldown = new Map()
    }

    private async sendMessage(channel: TextBasedChannel | null, Target: GuildMember, messageOptions: MessageCreateOptions) {
        if (!channel) return

        const messages = await Promise.all([
            await channel.send(messageOptions),
            await Target.send(messageOptions)
        ])

        setTimeout(async () => messages.forEach(message => message.delete()), 10_000)
    }

    private handleCooldown(interaction: ButtonInteraction) {
        const now = Date.now()
        const userCooldown = this.Cooldown.get(interaction.user.id)

        if (userCooldown && now < userCooldown.Timeout) {
            const remainingTime = Math.round(userCooldown.Timeout / 1000);
            interaction.editReply({ content: `❌ คุณต้องรอในอีก ⏳<t:${remainingTime}:R>` });

            setTimeout(() => interaction.editReply({ content: '🟢 Cool Down เสร็จสิ้น' }), userCooldown.Timeout - now);
            setTimeout(() => interaction.deleteReply(), userCooldown.Timeout - now + 5_000);

            return true;
        } else {
            this.Cooldown.delete(interaction.user.id);
            return false;
        }
    }

    async execute(Target: GuildMember | undefined, interaction: ButtonInteraction) {
        if (!Target) return interaction.editReply({ content: '❌ กรุณาระบุเป้าหมาย' })

        if (this.handleCooldown(interaction)) return;

        const user = await this.client.Database.Users.findOne({ UserId: interaction.user.id }) as any as IUser
        const level = await this.client.Database.Level.findOne({ LevelNo: user.stats.level.toString() }) as any as ILevel

        const target = await this.client.Database.Users.findOne({ UserId: Target.user.id }) as any as IUser
        const targetLevel = await this.client.Database.Level.findOne({ LevelNo: target.stats.level.toString() }) as any as ILevel

        const { DM, ATT, ACC } = await Calculator(this.client, user, level)
        const { AM, EVA } = await Calculator(this.client, target, targetLevel)

        const now = Date.now()
        const max = (100 / 100) * DM
        const min = (70 / 100) * DM
        const random = Math.floor(Math.random() * (max - min + 1) + min)

        const cooldown = now + (ATT * 1000)

        this.Cooldown.set(interaction.user.id, { Timeout: cooldown, CooldownSec: ATT })

        setTimeout(async () => {
            await interaction.editReply({ content: '🟢 Cool Down เสร็จสิ้น' })

            this.Cooldown.delete(interaction.user.id)
        }, (ATT * 1000))

        setTimeout(async () => await interaction.deleteReply(), (ATT * 1000) + 5_000)

        const TagFormat = `🔴<@${interaction.user.id}> 👊โจมตี <@${Target.id}>`
        const CooldownFormat = `⏳Cool Down <t:${Math.round((now / 1000) + ATT)}:R>`

        let Probability = 0

        if (parseInt(level.LevelNo) <= parseInt(targetLevel.LevelNo)) Probability = EVA - ACC
        else Probability = (parseInt(level.LevelNo) - parseInt(targetLevel.LevelNo)) * (-5) + (EVA - ACC)

        const expanded: { hit: boolean, Probability: number }[] = [{ hit: true, Probability }, { hit: false, Probability: 100 - Probability }].flatMap(hit => Array(hit.Probability).fill(hit))
        const randomHit = expanded[Math.floor(Math.random() * expanded.length)]

        await interaction.editReply({ content: CooldownFormat })

        if (randomHit.hit) return this.sendMessage(interaction.channel, Target, { content: `${TagFormat} 🤸ไม่โดน` })

        if (random < AM) return this.sendMessage(interaction.channel, Target, { content: `${TagFormat} 🛡ไม่เข้า` })

        await this.client.Database.Users.updateOne({ UserId: Target.user.id }, { $inc: { 'stats.HP.value': -(random) } })

        await this.client.Utils.CheckHPisZero(Target.guild, Target.user.id)

        const messageOptions: MessageCreateOptions = {}

        if (random < 10) messageOptions.content = `${TagFormat} เข้า ${random / 100} 🩸HP`
        else messageOptions.content = `${TagFormat} เข้า ${NumberWithCommas(random)} 🩸HP`

        this.sendMessage(interaction.channel, Target, messageOptions)
    }
}