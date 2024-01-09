import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, CommandInteraction, EmbedBuilder, GuildMember, StringSelectMenuBuilder, codeBlock } from "discord.js"
import Calculator from "../../Utils/Calculator"
import { CreateId, FloatWithCommas, NumberWithCommas, PrograssBar } from "../../Utils/Function"
import Client from "../../structure/Client"
import { ICooldown, ILevel, IUser, ItemEquip, TypeAB, TypeB, TypeP, TypePA, TypePD, EquipPos } from "../../types"

export default class {
    private UserTarget?: string
    private SelectAttackType?: string

    constructor(private client: Client, private UserId: string, private interaction: CommandInteraction) {

    }

    setUserTarget(UserId: string | undefined) {
        this.UserTarget = UserId
    }

    private async UserRender() {
        const User = await this.client.Database.Users.findOne({ UserId: this.UserId }) as IUser
        const Level = await this.client.Database.Level.findOne({ LevelNo: User.stats.level.toString() }) as any as ILevel
        const { HPMax, MPMax, HPR, MPR, HP_p: HPP, MP_p: MPP } = await Calculator(this.client, User, Level)
        const { HP, HP_p, MP, MP_p } = await this.client.Utils.UpdateHP_MP(null, User, HPMax, MPMax, HPR, MPR, HPP, MPP)

        let HPName = PrograssBar(HP_p)
        let MPName = ''

        if (MP_p >= 99) MPName = '🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦'
        else if (MP_p >= 90) MPName = '🟦🟦🟦🟦🟦🟦🟦🟦🟦'
        else if (MP_p >= 80) MPName = '🟦🟦🟦🟦🟦🟦🟦🟦'
        else if (MP_p >= 70) MPName = '🟦🟦🟦🟦🟦🟦🟦'
        else if (MP_p >= 60) MPName = '🟦🟦🟦🟦🟦🟦'
        else if (MP_p >= 50) MPName = '🟦🟦🟦🟦🟦'
        else if (MP_p >= 40) MPName = '🟦🟦🟦🟦'
        else if (MP_p >= 30) MPName = '🟦🟦🟦'
        else if (MP_p >= 20) MPName = '🟦🟦'
        else if (MP_p >= 10) MPName = '🟦'
        else MPName = ''

        const PlusSubtractFinder = (value: number): string => value <= 0 ? '' : `+`

        return `${codeBlock([
            `${Level.LevelName}`,
            `╭ HP🩸${HPName}${FloatWithCommas(HP_p)}%`,
            `╰ HP🩸${NumberWithCommas(HP)} (${PlusSubtractFinder(HPR)}${NumberWithCommas(HPR)}%)`,
            `╭ MP✨${MPName}${FloatWithCommas(MP_p)}%`,
            `╰ MP✨${NumberWithCommas(MP)} (${PlusSubtractFinder(MPR)}${NumberWithCommas(MPR)}%)`
        ].join('\n'))}`
    }

    private async TargetRender(Embed: EmbedBuilder, Escape: Collection<string, number>) {
        // const User = await this.client.Database.Users.findOne({ UserId: this.UserId }) as IUser
        const Member = await this.interaction.guild?.members.fetch(this.UserId)

        const members = Member?.voice.channel?.members.toJSON() as GuildMember[]

        const Escapes = (await Promise.all(Escape.map(async (leaveAt, UserId) => {
            const Target = await this.client.Database.Users.findOne({ UserId }) as IUser
            const Level = await this.client.Database.Level.findOne({ LevelNo: Target?.stats.level.toString() }) as any as ILevel

            // const { EC } = await Calculator(this.client, Target, Level)

            // const EscapeTime = (leaveAt + (((User.stats.level - Target.stats.level) * 20 - EC) * 1000)) - Date.now()

            // setTimeout(() => this.emit(EventType.Update), EscapeTime)

            // if (EscapeTime > 0) return `<@${UserId}> 🏃‍♂️หลบหนี ⌛<t:${Math.round((Date.now() / 1000) + (EscapeTime / 1000))}:R>`

            Escape.delete(UserId)

            return ''
        }))).filter((el) => el != '')

        Embed.addFields(
            {
                name: '╭ 🏃‍♂️ เป้าหมายที่กำลังหลบหนี ═══════════',
                value: Escapes.map((text, index) => `${index + 1}. ${text}`).join('\n') || '\u200b'
            },
            {
                name: '╭ 🎯 เป้าหมายที่เลือก ════════════════',
                value: this.UserTarget ? `<@${this.UserTarget}>` : '\u200b'
            }
        )

        return { members }
    }

    private async ItemsFinder() {
        const Equips: ItemEquip[] = await this.client.Database.Equips.find({ UserId: this.UserId }).toArray() as any
        const cooldown = await this.client.Database.Cooldowns.find({ UserId: this.UserId }).toArray() as any as ICooldown[]
        const now = Date.now()

        const Items = await Promise.all(Equips.map(async Equip => ({
            Item: await this.client.Database.Items(Equip.ItemId), Equip
        })))

        const EquipFinder = async (EquipPos: string) => {
            const Result: string[] = []

            const ItemFilter = Items.filter(({ Item, Equip }) => {
                const PassiveMe = (Item as TypeAB | TypeB).PassiveMe

                if (PassiveMe && PassiveMe.EquipPos == EquipPos) return true

                const PassiveTarget = (Item as TypePA | TypeP | TypePD).PassiveTarget

                if (PassiveTarget && PassiveTarget.EquipPos == EquipPos) return true

                return false
            })

            for (let i in ItemFilter) {
                const { Equip, Item } = ItemFilter[i]

                if (!Item) continue

                let CD = cooldown.find(c => c.ItemId == Item.Base.ItemId)

                if (CD && CD.TimeOut < now) {
                    await this.client.Database.Cooldowns.deleteOne({ UserId: this.UserId, ItemId: Item.Base.ItemId })

                    CD = undefined
                }

                const CooldownStatus = CD ? CD.TimeOut < now ? `\`❌\`` : `\`✅\`` : `\`✅\``
                const CooldownTime = CD ? CD.TimeOut < now ? `⌛<t:${Math.round((Date.now() / 1000) + (CD.TimeOut / 1000))}:R>` : `` : ``
                const NameFormat = `${CooldownStatus}${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName}${CooldownTime}`

                Result.push(NameFormat)
            }

            return {
                text: Result.join('\n') || '\u200b',
                Items: ItemFilter.map(({ Item, Equip }) => ({
                    Label: `${Item?.Base.ItemId} ${Item?.Base.ItemId}`,
                    value: Item?.Base.ItemId as string
                }))
            }
        }

        const GeneralTips = await EquipFinder(EquipPos.GeneralTips.type)
        const ItemUse = await EquipFinder(EquipPos.ItemUse.type)
        const MainWeapon = await EquipFinder(EquipPos.MainWeapon.type)
        const SecretWeapon = await EquipFinder(EquipPos.SecretWeapon.type)
        const Wing = await EquipFinder(EquipPos.Wing.type)
        const ItemTransfrom = await EquipFinder(EquipPos.ItemTransFrom.type)
        const Armor = await EquipFinder(EquipPos.Armor.type)

        const Custom = this.SelectAttackType ? await EquipFinder(this.SelectAttackType) : undefined

        return { GeneralTips, ItemUse, MainWeapon, SecretWeapon, Wing, ItemTransfrom, Armor, Custom }
    }

    RenderSelectUser(members: GuildMember[]) {
        try {
            return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select-user')
                    .setPlaceholder('🎯เลือกเป้าหมายที่ต้องการ')
                    .setDisabled(members.length === 0)
                    .setMinValues(1)
                    .addOptions(
                        members.length === 0
                            ? [{ label: 'NONE', value: 'NONE' }]
                            : members.map((member) => ({
                                label: this.UserTarget === member.id ? `${member.nickname ?? member.user.username} (${member.user.username}) กำลังเลือก` : `${member.nickname ?? member.user.username} (${member.user.username})`,
                                value: member.id
                            }))
                    )
            );
        } catch {
            return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select-user')
                    .setPlaceholder('🎯เลือกเป้าหมายที่ต้องการ')
                    .setDisabled(true)
                    .setMinValues(1)
                    .addOptions([{ label: 'NONE', value: 'NONE' }])
            );
        }
    }

    async Display(Escape: Collection<string, number>) {
        const { GeneralTips, ItemUse, MainWeapon, SecretWeapon, Wing, ItemTransfrom, Armor, Custom } = await this.ItemsFinder()
        const Embed = new EmbedBuilder()
            .setTitle(`⚔️VS ต่อสู้🏹`)
            .setDescription(`${await this.UserRender()}`)
            .addFields(
                {
                    name: '╭ 💥 วรยุทธ์ ───────────────────────────',
                    value: GeneralTips.text
                },
                {
                    name: '╭ 🃏 ไอเทมพิเศษ ───────────────────────',
                    value: ItemUse.text
                },
                {
                    name: '╭ ⚔️ อาวุธหลัก ─────────────────────────',
                    value: MainWeapon.text
                },
                {
                    name: '╭ 🗡️ อาวุธรอง ──────────────────────────',
                    value: SecretWeapon.text
                },
                {
                    name: '╭ 🛡️ ชุดเกราะ ──────────────────────────',
                    value: Armor.text
                },
                {
                    name: '╭ 🦋 ปีกบิน ────────────────────────────',
                    value: Wing.text
                },
                {
                    name: '╭ 👿 จิตรอสูร ──────────────────────────',
                    value: ItemTransfrom.text
                }
            )

        const { members } = await this.TargetRender(Embed, Escape)

        let components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = []

        const createSelectMenu = (placeholder: string, options: { Label: string, value: string }[]) => {
            if (options.length !== 0) {
                components.push(
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                        new StringSelectMenuBuilder()
                            .setPlaceholder(placeholder)
                            .setCustomId(`attack-${CreateId(16)}`) // fix Discord API : Component custom id cannot be duplicated 
                            .setMinValues(1)
                            .setDisabled(!this.UserTarget)
                            .addOptions(options.map(({ Label, value }) => ({
                                label: Label,
                                value: value
                            })))
                    )
                );
            }
        }

        if (Custom) {
            let title = 'เลือกอาวุธที่ต้องการใช้'
            switch (this.SelectAttackType) {
                case EquipPos.GeneralTips.type:
                    title = '💥 เลือกวรยุทธ์ที่ต้องการใช้';
                    break;
                case EquipPos.ItemUse.type:
                    title = '🃏 เลือกไอเทมพิเศษที่ต้องการใช้';
                    break;
                case EquipPos.MainWeapon.type:
                    title = '⚔️ เลือกอาวุธหลักที่ต้องการใช้';
                    break;
                case EquipPos.SecretWeapon.type:
                    title = '🗡️ เลือกอาวุธรองที่ต้องการใช้';
                    break;
                case EquipPos.Wing.type:
                    title = '🦋 เลือกปีกบินที่ต้องการใช้';
                    break;
                case EquipPos.ItemTransFrom.type:
                    title = '👿 เลือกจิตรอสูรที่ต้องการใช้';
                    break;
            }

            createSelectMenu(title, Custom.Items);

            components.push(
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setLabel('กลับหน้าหลัก')
                        .setDisabled(!this.UserTarget)
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId('attack-back')
                )
            )
        } else {
            createSelectMenu('💥 เลือกวรยุทธ์ที่ต้องการใช้', GeneralTips.Items);
            createSelectMenu('🃏 เลือกไอเทมพิเศษที่ต้องการใช้', ItemUse.Items);
            createSelectMenu('⚔️ เลือกอาวุธหลักที่ต้องการใช้', MainWeapon.Items);
            createSelectMenu('🗡️ เลือกอาวุธรองที่ต้องการใช้', SecretWeapon.Items);
            createSelectMenu('🦋 เลือกปีกบินที่ต้องการใช้', Wing.Items);
            createSelectMenu('👿 เลือกจิตรอสูรที่ต้องการใช้', ItemTransfrom.Items);
        }

        const Buttons = [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('👊')
                        .setDisabled(!this.UserTarget)
                        .setStyle(ButtonStyle.Success)
                        .setCustomId('attack-default')
                ),
        ]

        if (components.length > 3) {
            Buttons[0].addComponents(
                new ButtonBuilder()
                    .setLabel('⚔️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(MainWeapon.Items.length === 0)
                    .setCustomId(`selectType-${EquipPos.MainWeapon.type}`),

                new ButtonBuilder()
                    .setLabel('🗡️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(SecretWeapon.Items.length === 0)
                    .setCustomId(`selectType-${EquipPos.SecretWeapon.type}`),

                new ButtonBuilder()
                    .setLabel('💥')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(GeneralTips.Items.length === 0)
                    .setCustomId(`selectType-${EquipPos.GeneralTips.type}`),

                new ButtonBuilder()
                    .setLabel('🃏')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(ItemUse.Items.length === 0)
                    .setCustomId(`selectType-${EquipPos.ItemUse.type}`),
            )
            Buttons.push(
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('🦋')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(Wing.Items.length === 0)
                            .setCustomId(`selectType-${EquipPos.Wing.type}`),

                        new ButtonBuilder()
                            .setLabel('👿')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(ItemTransfrom.Items.length === 0)
                            .setCustomId(`selectType-${EquipPos.ItemTransFrom.type}`),
                    ),
            )

            components = Buttons
        } else {
            components.push(...Buttons)
        }

        components.unshift(this.RenderSelectUser(members))

        return { embeds: [Embed], components }
    }

    async setDisplayAttack(ItemType?: string) {
        this.SelectAttackType = ItemType
    }
}