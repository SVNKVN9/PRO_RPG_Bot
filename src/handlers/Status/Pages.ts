import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, MessageEditOptions, StringSelectMenuBuilder, StringSelectMenuInteraction, codeBlock } from "discord.js"
import Calculator from "../../Utils/Calculator"
import { FloatWithCommas, NumberWithCommas, PrograssBar, minToTime, msToDHM, msToDHMS_Thai_V2, msToHour } from "../../Utils/Function"
import Client from "../../structure/Client"
import { EquipPos, ICooldown, ILevel, IUser, ItemEquip, TypeAB, TypeB, TypeP, TypePA, TypePD } from "../../types"
import { SecondRow } from "./Rander"

export default class Pages {
    private Embed: EmbedBuilder
    private SelectRemove: StringSelectMenuBuilder
    private User: IUser
    private Level: ILevel
    private Equips: ItemEquip[]
    private Cooldowns: ICooldown[]
    private client: Client
    private interaction: StringSelectMenuInteraction | ButtonInteraction
    private PageNo: number

    constructor(User: IUser, Level: ILevel, Equips: ItemEquip[], Cooldowns: ICooldown[], client: Client, interaction: StringSelectMenuInteraction | ButtonInteraction, PageNo: number, SubPageNo?: number) {
        this.User = User
        this.Level = Level
        this.Equips = Equips
        this.Cooldowns = Cooldowns
        this.client = client
        this.interaction = interaction
        this.PageNo = PageNo

        this.Embed = new EmbedBuilder()
            .setTimestamp()
            .setFooter({ text: `Stats หน้าที่ ${this.PageNo > 10 ? this.PageNo.toString().split("").join('/') : this.PageNo}` })

        this.SelectRemove = new StringSelectMenuBuilder()
            .setCustomId('Stats-remove')
            .setPlaceholder('⚠️เลือกหัวข้อไอเทมที่ต้องการถอด')
    }

    private async EquipPositionFinder(EquipPos: EquipPos, Type: number) {
        /*  EquipsOptions Type Example
            1.  ┏ 📚 ตำราเทคนิคการบ่มเพาะพลัง
                ┣───────────────────────────────
                ┣ BG.012 📕 ตำรา เทพวิถีฟ้า
                ┣ ⏳เหลือเวลา : 1d 3h 35m
                ╰───────────────────────────────
            2.  ┏ 💀 สถานะผิดปกติ
                ┣───────────────────────────────
                ┣ 1．PS.B03 พิษเพลิงอสูร (100%) ⏱️213d 20h 30m 30s
                ┣ 2．PS.B08 พิษอัมพาต (100%) ⏱️213d 20h 30m 30s
                ╰───────────────────────────────
            3.  ┏  🧘เคล็ดวิชา
                ┣───────────────────────────────
                ┣ 1．SP.01 ☯️เคล็ดวิชา ตัวเบา
                ┣ 2．SP.02 ☯️เคล็ดวิชา พลังวิญญาณดูดกลืน
                ┣ 3．SP.03 ☯️เคล็ดวิชา กายาทอง
                ╰───────────────────────────────
            4.  ┏  💥วรยุทธ์
                ┣───────────────────────────────
                ┣ 1．AU.Y10 วรยุทธ์ ฟ้าลงทัณฑ์
                ┃ ⤷ 🟢พร้อมใช้
                ┣ 2．AU.Y11 วรยุทธ์ กระจกเงาลวงตา
                ┃ ⤷ ⏱️3 นาที
                ╰───────────────────────────────
            5.  ┍  🩸 สายเลือด
                ┣───────────────────────────────
                ┣ สายเลือด มังกร
                ┣ สายเลือด อสูรจิ้งจอกสายฟ้า
                ┣ สายเลือด ตระกูล หอคอยแก้วเก้าชั้นฟ้า
                ┣ สายเลือด Beta ดั้งเดิม
                ┣ สายเลือด เทพบรรพกาล
                ╰──────────────────────────────
            6.  ┏  ✡️ ธาตุ
                ┣───────────────────────────────
                ┣ 🗻ดิน
                ┣ 💧น้ำ
                ┣ 🌀ลม
                ┣ 🔥ไฟ
                ┣ ⚡สายฟ้า
                ┣ 🧊น้ำแข็ง
                ╰───────────────────────────────
            7.  ┏  💠 ตราสัญลักษณ์
                ┣───────────────────────────────
                ┣ 1．EB.01 🉐 ตราผู้ตรวจการ
                ┣ 2．EB.02 ☯️ ตรับผู้พิทัก
                ┣ 3．EB.X1 🔰 ประชากรชั่วคราว (⌛1d 20h 30m)
                ┣ 4．EB.A9 🔱 ตราเจ้าเมือง
                ╰───────────────────────────────
        */

        const Result = []

        const now = Date.now()

        const Items = await Promise.all(this.Equips.map(async Equip => ({
            Item: await this.client.Database.Items(Equip.ItemId), Equip
        })))

        const ItemFilter = Items.filter(({ Item, Equip }) => {
            const PassiveMe = (Item as TypeAB | TypeB).PassiveMe

            if (PassiveMe && PassiveMe.EquipPos == EquipPos.type) return true

            const PassiveTarget = (Item as TypePA | TypeP | TypePD).PassiveTarget

            if (PassiveTarget && PassiveTarget.EquipPos == EquipPos.type) return true

            return false
        })

        const LineStart = '┣───────────────────────────────'
        const LineEnd = '╰───────────────────────────────'
        // Result.push(`┏ ${EquipPos.title}`)
        Result.push(LineStart)

        for (let i in ItemFilter) {
            const { Equip, Item } = ItemFilter[i]

            if (!Item) continue

            const ms = Equip.TimeOut - Date.now()

            if (Equip.TimeOut && ms < 0) {
                await this.client.Database.Equips.deleteOne({ UserId: this.User.UserId, ItemId: Equip.ItemId })

                continue
            }
            const CD = this.Cooldowns.find(c => c.ItemId == Equip.ItemId)

            const NameFormat = `${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName}`
            const CooldownFormat = CD ? CD.Timeout < now ? `⏱️${msToDHMS_Thai_V2(now - CD.Timeout)}` : `\`🟢พร้อมใช้\`` : `\`🟢พร้อมใช้\``

            switch (Type) {
                case 1:
                    Result.push(`┣ ${NameFormat}`)
                    Result.push(`┣ เหลือเวลา ⏳ : ${msToDHM(ms)}`)
                    break;
                case 2:
                    Result.push(`┣${parseInt(i) + 1}．${Item.Base.ItemName} (${msToDHM(ms)})`)
                    break;
                case 3:
                    Result.push(`┣ ${NameFormat}`)
                    break;
                case 4:
                    Result.push(`┣ ${parseInt(i) + 1}．${Item.Base.ItemName}`)
                    Result.push(`┣ ⤷ ${CooldownFormat}`)
                    break;
                case 5:
                    Result.push(`┣${parseInt(i) + 1}．${Item.Base.ItemId} ${Item.Base.ItemName}`)
                    break;
                case 6:
                    Result.push(`┣${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName}`)
                    break;
                case 7:
                    // ยังไม่เสร็จ ขก.
                    Result.push(`┣ ${NameFormat}`)
                    break;
            }
        }

        Result.push(LineEnd)

        return Result
    }

    public async Render(): Promise<MessageEditOptions> {
        const row = SecondRow(this.interaction.user.id)

        switch (this.PageNo) {
            case 1:
                await this.Page1()
                break;
            case 2:
                await this.Page2()
                break;
            case 31:
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`Stats-${''}`)
                        .setLabel('⬅️ก่อนหน้า')
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Primary),

                    new ButtonBuilder()
                        .setCustomId(`Stats-${32}`)
                        .setLabel('หน้าถัดไป➡️')
                        .setStyle(ButtonStyle.Primary),
                )
                await this.Page31()
                break;
            case 32:
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`Stats-${31}`)
                        .setLabel('⬅️ก่อนหน้า')
                        .setStyle(ButtonStyle.Primary),

                    new ButtonBuilder()
                        .setCustomId(`Stats-${33}`)
                        .setLabel('หน้าถัดไป➡️')
                        .setStyle(ButtonStyle.Primary),
                )
                await this.Page32()
                break;
            case 33:
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`Stats-${32}`)
                        .setLabel('⬅️ก่อนหน้า')
                        .setStyle(ButtonStyle.Primary),

                    new ButtonBuilder()
                        .setCustomId(`Stats-${''}`)
                        .setDisabled(true)
                        .setLabel('หน้าถัดไป➡️')
                        .setStyle(ButtonStyle.Primary),
                )
                await this.Page33()
                break;
            case 4:
                await this.Page4()
                break;
            case 5:
                await this.Page5()
                break;
            case 6:
                await this.Page6()
                break;
            case 7:
                await this.Page7()
                break;
            case 8:
                await this.Page8()
                break;
            case 81:
                await this.Page81()
                break;
            case 82:
                await this.Page82()
                break;
            case 83:
                await this.Page83()
                break;
            case 9:
                await this.Page9()
                break;

        }

        if (this.SelectRemove.options.length) {
            this.SelectRemove
        }

        return {
            embeds: [this.Embed],
            components: [
                ...(this.SelectRemove.options.length ? [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(this.SelectRemove)] : []),
                row,
            ]
        }
    }

    private async Page1() {
        const { Tx, APH, APW, EPH, EPW } = await Calculator(this.client, this.User, this.Level)

        const { TxValue } = await this.client.Database.Guilds.findOne({ id: this.interaction.guildId as string })
        const rawlevels = await this.client.Database.Level.find({}).toArray() as any as ILevel[]
        const levels = rawlevels.sort((a, b) => parseInt(a.EXPNeed) - parseInt(b.EXPNeed))

        let nextLevel = levels[levels.indexOf(levels.find(level => parseFloat(level.LevelNo) == this.User.stats.level) as ILevel) + 1]

        const EXP_p = (this.User.stats.exp - parseInt(this.Level.EXPNeed)) / (parseInt(nextLevel.EXPNeed) - parseInt(this.Level.EXPNeed)) * 100

        let EXPName = ''

        if (EXP_p >= 91) EXPName = '🟦🟦🟦🟪🟪🟪🟫🟫🟫⬛'
        else if (EXP_p >= 81) EXPName = '🟦🟦🟦🟪🟪🟪🟫🟫🟫'
        else if (EXP_p >= 71) EXPName = '🟦🟦🟦🟪🟪🟪🟫🟫'
        else if (EXP_p >= 61) EXPName = '🟦🟦🟦🟪🟪🟪🟫'
        else if (EXP_p >= 51) EXPName = '🟦🟦🟦🟪🟪🟪'
        else if (EXP_p >= 41) EXPName = '🟦🟦🟦🟪🟪'
        else if (EXP_p >= 31) EXPName = '🟦🟦🟦🟪'
        else if (EXP_p >= 21) EXPName = '🟦🟦🟦'
        else if (EXP_p >= 11) EXPName = '🟦🟦'
        else EXPName = '🟦'

        this.Embed.setTitle('🧘🏻‍♀️การบ่มเพาะพลัง')
            .setColor('Yellow')
            .addFields(
                {
                    name: '⏫ ระดับขั้น',
                    value: codeBlock(this.Level.LevelName)
                },
                {
                    "name": "💯Level",
                    "value": codeBlock('autohotkey', `${NumberWithCommas(this.User.stats.level)} ${EXPName} ${EXP_p.toFixed(2)}%`),
                    "inline": false
                },
                {
                    "name": "⌚Time เวลาออนรวม",
                    "value": codeBlock('autohotkey', `${msToDHM(this.User.stats.time)}`),
                    "inline": false
                },
                {
                    "name": "✨EXP ขอบเขตพลังวิญญาณ",
                    "value": codeBlock('autohotkey', `${FloatWithCommas(this.User.stats.exp)}`),
                    "inline": false
                },
                {
                    "name": "📈Tx อัตราการบ่มเพราะพลัง",
                    "value": codeBlock('autohotkey', `${FloatWithCommas(Tx + parseFloat(TxValue))}`),
                    "inline": false
                },
                {
                    "name": "🧪พลังวิญญาณสวรรค์",
                    "value": codeBlock('autohotkey', `🧲 อัตราการดูดซับ ➜ APH : ${FloatWithCommas(APH)}/D\n🧪 พลังจำกัด     ➜ EAH : ${FloatWithCommas(this.User.stats.EAH)} \n☢️ พลังอนันต์     ➜ EPH : ${FloatWithCommas(EPH)}`),
                },
                {
                    "name": "💎พลังวิญญาณพิภพ",
                    "value": codeBlock('autohotkey', `🧲 อัตราการดูดซับ ➜ APW : ${FloatWithCommas(APW)}/D\n💎 พลังจำกัด     ➜ EAW : ${FloatWithCommas(this.User.stats.EAW)} \n☢️ พลังอนันต์     ➜ EPW : ${FloatWithCommas(EPW)}`),
                },
                {
                    "name": "📚ตำราเทคนิคการบ่มเพาะพลัง",
                    "value": (await this.EquipPositionFinder(EquipPos.CultivationTechnique, 1)).join('\n'),
                    "inline": false
                },
                {
                    "name": "💊โอสถบ่มเพาะพลัง",
                    "value": (await this.EquipPositionFinder(EquipPos.CultivationEnhancement, 1)).join('\n'),
                    "inline": false
                }
            )
    }

    private async Page2() {
        this.Embed.setTitle('⚠ สถานะติดตัว')
            .setColor('Yellow')
            .addFields(
                {
                    name: '┏ 💀 สถานะผิดปกติ',
                    value: (await this.EquipPositionFinder(EquipPos.AbnormalEffect, 2)).join('\n')
                },
                {
                    name: '┏ ❓ สถานะพิเศษ',
                    value: (await this.EquipPositionFinder(EquipPos.SpecialEffect, 2)).join('\n')
                },
                {
                    name: '┏ 🩹 บาดแผล',
                    value: (await this.EquipPositionFinder(EquipPos.Wound, 2)).join('\n')
                }
            )
    }

    private async Page31() {
        const {
            DM, AM, HPMax, MPMax, HPR, MPR, HP_p, MP_p, HPT, MPT,
            WEI, IMM, PoR, IPR, MaR, MaD, ACC, EVA, ATS, ATT, MOS, VIS, INS, SCR, ICR
        } = await Calculator(this.client, this.User, this.Level)

        const { HP, HP_p: HPP, MP, MP_p: MPP } = await this.client.Utils.UpdateHP_MP(this.interaction.guild, this.User, HPMax, MPMax, HPR, MPR, HP_p, MP_p)

        let HPName = PrograssBar(HPP)
        let MPName = ''

        if (MPP >= 99) MPName = '🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦'
        else if (MPP >= 90) MPName = '🟦🟦🟦🟦🟦🟦🟦🟦🟦'
        else if (MPP >= 80) MPName = '🟦🟦🟦🟦🟦🟦🟦🟦'
        else if (MPP >= 70) MPName = '🟦🟦🟦🟦🟦🟦🟦'
        else if (MPP >= 60) MPName = '🟦🟦🟦🟦🟦🟦'
        else if (MPP >= 50) MPName = '🟦🟦🟦🟦🟦'
        else if (MPP >= 40) MPName = '🟦🟦🟦🟦'
        else if (MPP >= 30) MPName = '🟦🟦🟦'
        else if (MPP >= 20) MPName = '🟦🟦'
        else if (MPP >= 10) MPName = '🟦'
        else MPName = ''

        const PlusSubtractFinder = (value: number): string => value <= 0 ? '' : `+`

        this.Embed.setTitle('⭐ สรุปค่าพลัง')
            .setColor('Yellow')
            .addFields(
                {
                    "name": "🩸พลังชีวิต",
                    "value": codeBlock('js', `HP%🩸${HPName}${HPP}%\nHP 🩸${NumberWithCommas(HP)}\nHPR🩸${HPR}% (${PlusSubtractFinder(HPT)}${FloatWithCommas(HPT)} /min.)`),
                    "inline": false
                },
                {
                    "name": "✨พลังจิต",
                    "value": codeBlock('js', `MP%✨${MPName}${MPP}%\nMP ✨${NumberWithCommas(MP)}\nMPR✨${MPR}% (${PlusSubtractFinder(MPT)}${FloatWithCommas(MPT)} /min.)`),
                    "inline": false
                },
                {
                    "name": "👊🏻 พลังโจมตีหลัก",
                    "value": codeBlock('js', `${NumberWithCommas(DM)} DM`),
                    "inline": false
                },
                {
                    "name": "🛡 พลังป้องกันกายภาพภายนอก",
                    "value": codeBlock('js', `${NumberWithCommas(AM)} AM`),
                    "inline": false
                },
                {
                    "name": "🏷️ ขีดความสามารถทั่วไป",
                    "value": codeBlock('js', `1.  น้ำหนักตัวรวมสัมภาระ  WEI : ${WEI} kg\n2.  ภูมิคุ้มกัน           IMM : ${IMM}% \n3.  ต้านทานพิษ         PoR : ${PoR}%\n4.  ต้านทานภายใน       IPR : ${IPR}%\n5.  ต้านทานเวทมนตร์     MaR : ${MaR}%\n6.  ความเสียหายเวท      MaD : ${MaD}%\n7.  ความแม่นยำ         ACC : ${ACC}%\n8.  การหลบหลีก         EVA : ${EVA}%\n9.  ความเร็วโจมตี        ATS : ${ATS}(${ATT} s)\n10. ความเร็วเคลื่อนที่      MOS : ${MOS}\n11. ทัศนวิสัย            VIS : ${VIS} s\n12. สัญชาตญาณ         INS : ${INS} s\n13. ลดคูลดาวน์สกิล       SCR : ${SCR}%\n14. ลดคูลดาวน์ไอเทม      ICR : ${ICR}%`),
                    "inline": false
                }
            )
    }

    private async Page32() {
        const {
            EaD, WaD, AiD, FiD, LiD, IcD,
            EaR, WaR, AiR, FiR, LiR, IcR
        } = await Calculator(this.client, this.User, this.Level)

        this.Embed.setTitle('✡️ คุณสมบัติเฉพาะธาตุ')
            .setColor('Yellow')
            .addFields(
                {
                    name: 'ความเสียหายการโจมตีธาตุ',
                    value: codeBlock(`autohotkey`, `● ความเสียหาย🗻ธาตุดิน       EaD : ${EaD}%\n● ความเสียหาย💧ธาตุน้ำ       WaD : ${WaD}%\n● ความเสียหาย🌀ธาตุลม       AiD : ${AiD}%\n● ความเสียหาย🔥ธาตุไฟ       FiD : ${FiD}%\n● ความเสียหาย⚡ธาตุสายฟ้า    LiD : ${LiD}%\n● ความเสียหาย🧊ธาตุน้ำแข็ง    IcD : ${IcD}%`)
                },
                {
                    name: 'ต้านทานการโจมตีธาตุ',
                    value: codeBlock(`autohotkey`, `● ต้านทาน🗻ธาตุดิน          EaR : ${EaR}%\n● ต้านทาน💧ธาตุน้ำ          WaR : ${WaR}%\n● ต้านทาน🌀ธาตุลม          AiR : ${AiR}%\n● ต้านทาน🔥ธาตุไฟ          FiR : ${FiR}%\n● ต้านทาน⚡ธาตุสายฟ้า       LiR : ${LiR}%\n● ต้านทาน🧊ธาตุน้ำแข็ง       IcR : ${IcR}%`)
                }
            )
    }

    private async Page33() {
        const {
            Tx, EP_p, APH, APW, EPH, EPW,
            HPMax, HP_p, HPM, HM_p, HPR, HDm, HRm, HD_p, HR_p, HPT,
            MPMax, MP_p, MPM, MM_p, MPR, MDm, MRm, MD_p, MR_p, MPT,
            AM, AMP, AM_p,
            WEI, WE, WE1,
            IMM, PoR, IPR, MaR, MaD, ACC, EVA, ATS, ATT, MOS, SMS, REF, VIS, INS, SCR, ICR,
            EaD, WaD, AiD, FiD, LiD, IcD, EaR, WaR, AiR, FiR, LiR, IcR
        } = await Calculator(this.client, this.User, this.Level)
        const {
            time, exp, EAH, EAW,
            HEA, HGF, HGD,
            STR, END, AGI, ING
        } = this.User.stats
        const {
            HP, HP_p: HPP, MP, MP_p: MPP
        } = await this.client.Utils.UpdateHP_MP(this.interaction.guild, this.User, HPMax, MPMax, HPR, MPR, HP_p, MP_p)

        const { TxValue } = await this.client.Database.Guilds.findOne({ id: this.interaction.guildId as string })

        const PlusSubtractFinder = (value: number): string => value <= 0 ? '' : `+`

        this.Embed.setTitle('📃 ค่าพลังข้อมูลทั้งหมด')
            .setColor('Blue')
            .addFields(
                {
                    name: '🧘🏻‍♀️ ข้อมูลการบ่มเพาะพลัง',
                    value: codeBlock('js', [
                        `1.  Level : ${this.Level.LevelNo}`,
                        `2.  Time : ${msToDHM(time)} (${msToHour(time)})`,
                        `3.  EXP : ${FloatWithCommas(exp)}`,
                        `4.  Tx  : ${FloatWithCommas(Tx + parseFloat(TxValue))}`,
                        `5.  XPs : ${this.Level.XPs}`,
                        `6.  EP% : ${EP_p} %`,
                        `7.  APH : ${FloatWithCommas(APH)}/D`,
                        `8.  APW : ${FloatWithCommas(APW)}/D`,
                        `9.  EAH : ${FloatWithCommas(EAH)}`,
                        `10. EAL : ${FloatWithCommas(EAW)}`,
                        `11. EPH : ${FloatWithCommas(EPH)}`,
                        `12. EPL : ${EPW}`,
                        `13. XPA : ${FloatWithCommas(EAH + EAW)}`
                    ].join('\n'))
                },
                {
                    name: '🩺 สุขภาพและความหิว',
                    value: codeBlock('js', [
                        `14. HEA : ${HEA.value}%`,
                        `15. HGF : ${minToTime(HGF.value)}`,
                        `16. HGD : ${minToTime(HGD.value)}`
                    ].join('\n'))
                },
                {
                    name: '👤 ข้อมูลทักษะด้านรางกาย',
                    value: codeBlock('js', [
                        `17. STR : ${STR}`,
                        `18. END : ${END}`,
                        `19. AGI : ${AGI}`,
                        `20. INT : ${ING}`
                    ].join('\n'))
                },
                {
                    name: '🩸 ข้อมูลพลังชีวิต',
                    value: codeBlock('js', [
                        `21. HPMax : ${NumberWithCommas(HPMax)}`,
                        `22. HP  : ${NumberWithCommas(HP)}`,
                        `23. HP% : ${HP_p}%`,
                        `24. HPL : ${NumberWithCommas(parseInt(this.Level.HPL))}`,
                        `25. HPM : ${HPM}`,
                        `26. HM% : ${HM_p}%`
                    ].join('\n'))
                },
                {
                    name: '🩸 ข้อมูลการฟื้นฟูพลังชีวิต',
                    value: codeBlock('js', [
                        `27. HPR : +${HPR}%`,
                        `28. HPT : ${NumberWithCommas(HPT)} HP/min.`,
                        `29. HDm : ${PlusSubtractFinder(HDm)}${HDm} HP/min.`,
                        `30. HRm : ${HRm} HP/min.`,
                        `31. HD% : ${PlusSubtractFinder(HD_p)}${HD_p}%`,
                        `32. HR% : ${PlusSubtractFinder(HR_p)}${HR_p}%`
                    ].join('\n'))
                },
                {
                    name: '✨ ข้อมูลพลังจิต',
                    value: codeBlock('js', [
                        `33. MPMax : ${NumberWithCommas(MPMax)}`,
                        `34. MP  : ${NumberWithCommas(MP)}`,
                        `35. MP% : ${MP_p}%`,
                        `36. MPL : ${NumberWithCommas(parseInt(this.Level.MPL))}`,
                        `37. MPM : ${MPM}`,
                        `38. MM% : ${MM_p}${MM_p}%`
                    ].join('\n'))
                },
                {
                    name: '✨ ข้อมูลการฟื้นฟูพลังจิต',
                    value: codeBlock('js', [
                        `39. MPR : +${MPR}%`,
                        `40. MPT : ${NumberWithCommas(MPT)} MP/min.`,
                        `41. MDm : ${PlusSubtractFinder(MDm)}${MDm} MP/min.`,
                        `42. MRm : ${PlusSubtractFinder(MRm)}${MRm} MP/min.`,
                        `43. MD% : ${PlusSubtractFinder(MD_p)}${MD_p}%`,
                        `44. MR% : ${PlusSubtractFinder(MR_p)}${MR_p}%`
                    ].join('\n'))
                },
                {
                    name: '🛡 ข้อมูลพลังป้องกันกายภาพภายนอก',
                    value: codeBlock('js', [
                        `45. AM  : ${AM}`,
                        `46. AML : ${NumberWithCommas(parseInt(this.Level.AML))}`,
                        `47. AMP : ${AMP}`,
                        `48. AM% : ${AM_p}%`
                    ].join('\n'))
                },
                {
                    name: '⚖️ น้ำหนัก',
                    value: codeBlock('js', [
                        `53. WEI : ${WEI} kg`,
                        `54. WE1 : ${WE1} kg`,
                        `55. WE2 : ${WE} kg`
                    ].join('\n'))
                },
                {
                    name: '🏷️ ขีดความสามารถทั่วไป',
                    value: codeBlock('js', [
                        `56. IMM : ${IMM}%`,
                        `57. PoR : ${PoR}%`,
                        `58. IPR : ${IPR}%`,
                        `59. MaR : ${MaR}%`,
                        `60. MaD : ${MaD}%`,
                        `61. ACC : ${ACC}%`,
                        `62. EVA : ${EVA}%`,
                        `63. ATS : ${ATS}(${ATT} s)`,
                        `64. MOS : ${MOS}`,
                        `65. SMS : ${SMS}`,
                        `66. REF : ${REF}%`,
                        `67. VIS : ${VIS} s`,
                        `68. INS : ${INS} s`,
                        `69. SCR : ${SCR}%`,
                        `70. ICR : ${ICR}%`
                    ].join('\n'))
                },
                {
                    name: '✡️ คุณสมบัติเฉพาะธาตุ',
                    value: codeBlock('js', [
                        `71. EaD : ${EaD}%`,
                        `72. WaD : ${WaD}%`,
                        `73. AiD : ${AiD}%`,
                        `74. FiD : ${FiD}%`,
                        `75. LiD : ${LiD}%`,
                        `76. IcD : ${IcD}%`,
                        `77. EaR : ${EaR}%`,
                        `78. WaR : ${WaR}%`,
                        `79. AiR : ${AiR}%`,
                        `80. FiR : ${FiR}%`,
                        `81. LiR : ${LiR}%`,
                        `82. IcR : ${IcR}%`
                    ].join('\n'))
                }
            )
    }

    private async Page4() {
        this.Embed.setTitle(`🥋วิชายุทธ์`)
            .setColor('Blue')
            .addFields(
                {
                    name: '┏ 🧘เคล็ดวิชา',
                    value: (await this.EquipPositionFinder(EquipPos.SecretTechnique, 3)).join('\n')
                },
                {
                    name: '┏ 💥วรยุทธ์',
                    value: (await this.EquipPositionFinder(EquipPos.GeneralTips, 3)).join('\n')
                }
            )

        this.SelectRemove.addOptions(
            {
                label: '🧘เคล็ดวิชา',
                value: EquipPos.SecretTechnique.type
            },
            {
                label: '💥วรยุทธ์',
                value: EquipPos.GeneralTips.type
            },
        )
    }

    private async Page5() {
        this.Embed.setTitle(':dragon02: ร่างแปลง')
            .setColor('Yellow')
            .addFields(
                {
                    name: '┏ จิตอสูร',
                    value: (await this.EquipPositionFinder(EquipPos.ItemTransFrom, 4)).join('\n')
                }
            )
    }

    private async Page6() {
        this.Embed.setTitle('👘 ไอเทมสวมใส่ภายนอก')
            .setColor('Blue')
            .addFields(
                {
                    name: '┏ 📿 เครื่องประดับ',
                    value: (await this.EquipPositionFinder(EquipPos.ItemDecoration, 5)).join('\n')
                },
                {
                    name: '┏ 💠 ตราสัญลักษณ์',
                    value: (await this.EquipPositionFinder(EquipPos.Emblem, 7)).join('\n')
                },
                {
                    name: '┏ 🥼 ชุดสวมใส่',
                    value: (await this.EquipPositionFinder(EquipPos.Armor, 3)).join('\n')
                },
                {
                    name: '┏  🦋 ปีกบิน',
                    value: (await this.EquipPositionFinder(EquipPos.Wing, 4)).join('\n')
                },
                {
                    name: '┏ ⚔️ อาวุธหลัก',
                    value: (await this.EquipPositionFinder(EquipPos.MainWeapon, 4)).join('\n')
                },
            )

        this.SelectRemove.addOptions(
            {
                label: '📿 เลือกไอเทมเครื่องประดับที่ต้องการถอด',
                value: EquipPos.ItemDecoration.type
            },
            {
                label: '💠 เลือกไอเทมตราสัญลักษณ์ที่ต้องการถอด',
                value: EquipPos.Emblem.type
            },
            {
                label: '🥼 เลือกไอเทมชุดสวมใส่ที่ต้องการถอด',
                value: EquipPos.Armor.type
            },
            {
                label: '🦋 เลือกไอเทมปีกบินที่ต้องการถอด',
                value: EquipPos.Wing.type
            },
            {
                label: '⚔️ เลือกไอเทมอาวุธหลักที่ต้องการถอด',
                value: EquipPos.MainWeapon.type
            }
        )
    }

    private async Page7() {
        this.Embed.setTitle('👚 ไอเทมสวมใส่ภายใน')
            .setColor('Blue')
            .addFields(
                {
                    name: '┏ 🅿ไอเทมลับ',
                    value: (await this.EquipPositionFinder(EquipPos.ItemSecret, 7)).join('\n')
                },
                {
                    name: '┏ 🅰ไอเทมกดใช้',
                    value: (await this.EquipPositionFinder(EquipPos.ItemUse, 4)).join('\n')
                },
                {
                    name: '┏ 🗡️ อาวุธลับ',
                    value: (await this.EquipPositionFinder(EquipPos.SecretWeapon, 4)).join('\n')
                },
            )

        this.SelectRemove.addOptions(
            {
                label: '🅿 เลือกไอเทมลับที่ต้องการถอด',
                value: EquipPos.ItemSecret.type
            },
            {
                label: '🅰 เลือกไอเทมกดใช้ที่ต้องการถอด',
                value: EquipPos.ItemUse.type
            },
            {
                label: ' 🗡️ เลือกไอเทมอาวุธลับที่ต้องการถอด',
                value: EquipPos.SecretWeapon.type
            },
        )
    }

    private Page8() {
        this.Embed.setTitle('🛠️ ทักษะความสามารถ')
            .setColor('Blue')
            .addFields(
                {
                    name: '⏫ แต้มอัพคงเหลือ ⏫',
                    value: codeBlock(`fix`, `${NumberWithCommas(this.User.stats.score)}`),
                    inline: false
                },
                {
                    name: '📊 กลุ่มทักษะ',
                    value: codeBlock(`fix`, `1. 👤ทักษะด้านรางกาย\n2. ⚔️ทักษะการใช้อาวุธ\n3. ⚗️ทักษะการสรรสร้าง`)
                }
            )
    }

    private Page81() {
        this.Embed.setTitle('8.1👤 ทักษะด้านรางกาย')
            .addFields(
                {
                    name: '⏫ แต้มอัพ ⏫',
                    value: `${codeBlock('js', ``)}${codeBlock('js', ``)}`
                }
            )
    }

    private Page82() {

    }

    private Page83() {

    }

    private async Page9() {
        this.Embed.setTitle('🧬อัตลักษณ์')
            .setColor('Blue')
            .addFields(
                {
                    "name": "┍ 👥เผ่าพันธ์",
                    "value": (await this.EquipPositionFinder(EquipPos.Race, 5)).join('\n'),
                    "inline": false
                },
                {
                    "name": "┍ 🩸สายเลือด",
                    "value": (await this.EquipPositionFinder(EquipPos.Blood, 5)).join('\n'),
                    "inline": false
                },
                {
                    "name": "┏ ✡️ธาตุ",
                    "value": (await this.EquipPositionFinder(EquipPos.PersonalElement, 6)).join('\n'),
                    "inline": false
                },
                {
                    "name": "┏ ☯️พลังพิเศษ",
                    "value": (await this.EquipPositionFinder(EquipPos.SuperPower, 5)).join('\n'),
                    "inline": false
                }
            )
    }
}