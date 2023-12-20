import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, CommandInteraction, EmbedBuilder, GuildMember, StringSelectMenuBuilder, codeBlock } from "discord.js"
import Calculator from "../../Utils/Calculator"
import { CreateId, NumberWithCommas, PrograssBar } from "../../Utils/Function"
import Client from "../../structure/Client"
import { ICooldown, ILevel, IUser, ItemEquip, TypeAB, TypeB, TypeP, TypePA, TypePD, EquipPos } from "../../types"

export default class {
    private UserTarget?: string

    constructor(private client: Client, private UserId: string, private interaction: CommandInteraction) {

    }

    setUserTarget(UserId: string | undefined) {
        this.UserTarget = UserId
    }

    private async UserRender() {
        const User = await this.client.Database.Users.findOne({ UserId: this.UserId }) as IUser
        const Level = await this.client.Database.Level.findOne({ LevelNo: User.stats.level.toString() }) as any as ILevel
        const { HP_p, MP_p } = await Calculator(this.client, User, Level)

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

        return `${codeBlock(`${Level.LevelName}\n╭ HP🩸${HPName}${HP_p}%\n╰ HP🩸${NumberWithCommas(User.stats.HP.value)}\n╭ MP✨${MPName}${MP_p}%\n╰ MP✨${NumberWithCommas(User.stats.MP.value)}\n`)}`
    }

    private async TargetRender(Embed: EmbedBuilder, Escape: Collection<string, number>) {
        const User = await this.client.Database.Users.findOne({ UserId: this.UserId }) as IUser
        const Member = await this.interaction.guild?.members.fetch(this.UserId)

        const members = Member?.voice.channel?.members.toJSON()
            .filter(member => member.id != Member?.voice.member?.id) as GuildMember[]

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

    private async ItemsFinder(CustomType?: string) {
        const Equips: ItemEquip[] = await this.client.Database.Equips.find({ UserId: this.UserId }).toArray() as any
        const cooldown = await this.client.Database.CooldownUse.find({ UserId: this.UserId }).toArray() as any as ICooldown[]
        const now = Date.now()

        const Items = await Promise.all(Equips.map(async Equip => ({
            Item: await this.client.Database.Items(Equip.ItemId), Equip
        })))

        const EquipFinder = async (EquipPos: EquipPos) => {
            const Result: string[] = []

            const ItemFilter = Items.filter(({ Item, Equip }) => {
                const PassiveMe = (Item as TypeAB | TypeB).PassiveMe

                if (PassiveMe && PassiveMe.EquipPos == EquipPos.type) return true

                const PassiveTarget = (Item as TypePA | TypeP | TypePD).PassiveTarget

                if (PassiveTarget && PassiveTarget.EquipPos == EquipPos.type) return true

                return false
            })

            for (let i in ItemFilter) {
                const { Equip, Item } = ItemFilter[i]

                if (!Item) continue

                const CD = cooldown.find(c => c.ItemId == Item.Base.ItemId)
                const CooldownStatus = CD ? CD.Timeout < now ? `\`❌\`` : `\`✅\`` : `\`✅\``
                const CooldownTime = CD ? CD.Timeout < now ? `⌛<t:${Math.round((Date.now() / 1000) + (CD.Timeout / 1000))}:R>` : `` : ``
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

        const GeneralTips = await EquipFinder(EquipPos.GeneralTips)
        const ItemUse = await EquipFinder(EquipPos.ItemUse)
        const MainWeapon = await EquipFinder(EquipPos.MainWeapon)
        const SecretWeapon = await EquipFinder(EquipPos.SecretWeapon)
        const Wing = await EquipFinder(EquipPos.Wing)
        const ItemTransfrom = await EquipFinder(EquipPos.ItemTransFrom)
        const Armor = await EquipFinder(EquipPos.Armor)

        if (CustomType) {
            for (let key in EquipPos) {
                console.log((EquipPos as any)[key].type)
            }
        }

        // const Custom = await EquipFinder()

        return { GeneralTips, ItemUse, MainWeapon, SecretWeapon, Wing, ItemTransfrom, Armor, Custom: undefined }
    }

    RenderSelectUser(members: GuildMember[]) {
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
                            label: this.UserTarget === member.id ? `${member.user.username} กำลังเลือก` : member.user.username,
                            value: member.id
                        }))
                )
        );
    }

    async Display(Escape: Collection<string, number>) {
        const { GeneralTips, ItemUse, MainWeapon, SecretWeapon, Wing, ItemTransfrom, Armor } = await this.ItemsFinder()
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

        createSelectMenu('💥 เลือกวรยุทธ์ที่ต้องการใช้', GeneralTips.Items);
        createSelectMenu('🃏 เลือกไอเทมพิเศษที่ต้องการใช้', ItemUse.Items);
        createSelectMenu('⚔️ เลือกอาวุธหลักที่ต้องการใช้', MainWeapon.Items);
        createSelectMenu('🗡️ เลือกอาวุธรองที่ต้องการใช้', SecretWeapon.Items);
        createSelectMenu('🦋 เลือกปีกบินที่ต้องการใช้', Wing.Items);
        createSelectMenu('👿 เลือกจิตรอสูรที่ต้องการใช้', ItemTransfrom.Items);

        const Buttons = [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('👊')
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Success)
                        .setCustomId('default')
                ),
        ]

        if (components.length > 3) {
            Buttons[0].addComponents(
                new ButtonBuilder()
                    .setLabel('⚔️')
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(EquipPos.MainWeapon.type),

                new ButtonBuilder()
                    .setLabel('🗡️')
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(EquipPos.SecretWeapon.type),

                new ButtonBuilder()
                    .setLabel('💥')
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(EquipPos.GeneralTips.type),

                new ButtonBuilder()
                    .setLabel('🃏')
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(EquipPos.ItemUse.type)
            )
            Buttons.push(
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('🦋')
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(EquipPos.Wing.type),

                        new ButtonBuilder()
                            .setLabel('👿')
                            .setStyle(ButtonStyle.Danger)
                            .setCustomId(EquipPos.ItemTransFrom.type)
                    ),
            )

            components = Buttons
        }

        components.unshift(this.RenderSelectUser(members))

        return { embeds: [Embed], components }
    }

    async DisplayAttack(ItemType: string) {
        const { GeneralTips, ItemUse, MainWeapon, SecretWeapon, Wing, ItemTransfrom, Armor } = await this.ItemsFinder()

        console.log({ GeneralTips, ItemUse, MainWeapon, SecretWeapon, Wing, ItemTransfrom, Armor })
    }
}