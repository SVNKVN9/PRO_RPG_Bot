import { codeBlock, EmbedBuilder, InteractionReplyOptions, MessageCreateOptions } from "discord.js"
// import { IActivate, IATmagic, IATphysical, IBase, ICasting, ICondionOpenItem, IConditionTarget, INotification, IPassive, ItemBase } from "../types"
import Client from "../structure/Client"

// const EmbedBase = (Embed: EmbedBuilder, Item: any) => {
//     const Base: IBase = Item.Base
//     const Casting: ICasting = Item.UseItem
//     const TextArray: string[] = []
//     const CmdList: string[] = []
//     const Description: string[] = ['┍ **คำอธิบายไอเทม**\n', '┣───────────────────────────➤\n']

//     if (Base.ItemAge) TextArray.push(`-  อายุไอเทม (d/h/m/s): ${Base.ItemAge}`)
//     if (Base.Size) TextArray.push(`- ขนาดไอเทม: ${Base.Size}`)
//     if (Base.MemberCanTrade) TextArray.push(`- สมาชิกที่สามารถแลกเปลี่ยน: ${Base.MemberCanTrade}`)
//     if (Base.RoleCanTrade) TextArray.push(`- Role ที่สามารถแลกเปลี่ยน: ${Base.RoleCanTrade}`)
//     if (Base.ItemId) TextArray.push(`- การรหัสใช้ไอเทม: ${Base.ItemId}`)

//     const LoopList = (cmd: Object) => {
//         for (const [key, value] of Object.entries(cmd)) CmdList.push(`/${key}`)
//     }

//     if (Casting.EnableMe && Casting.Me) LoopList(Casting.Me)
//     if (Casting.EnableAccept && Casting.Accept) LoopList(Casting.Accept)
//     if (Casting.EnableNotAccept && Casting.NotAccept) LoopList(Casting.NotAccept)

//     if (CmdList.length > 0) TextArray.push(`- คำสั่งตั้งต้น: ${CmdList.join(', ')}`)

//     if (Base.Description) Base.Description.split('\n').forEach((text: string) => Description.push(`┃${text}\n`))

//     Description.push('╰───────────────────────────➤\n')

//     Embed.addFields({
//         name: '📑 รายละเอียดพื้นฐาน', value: `
//         ${codeBlock('autohotkey', TextArray.join('\n'))}
//         ${Description.join(' ')}
//     ` })
// }

// const EmbedConditionOpenItem = (Embed: EmbedBuilder, ConditionOpenItem: ICondionOpenItem) => {
//     const TextArray: string[] = []

//     if (ConditionOpenItem.MPUse) TextArray.push(`- MP ที่ต้องใช้: ${ConditionOpenItem.MPUse}`)
//     if (ConditionOpenItem.MPUse_p) TextArray.push(`- MP % ที่ต้องใช้: ${ConditionOpenItem.MPUse_p}%`)
//     if (ConditionOpenItem.ItemUseHave) TextArray.push(`- ไอเทมสวมใส่ที่ต้องมี: ${ConditionOpenItem.ItemUseHave}`)
//     if (ConditionOpenItem.ItemUseNotHave) TextArray.push(`- ไอเทมสวมใส่ที่ห้ามมี: ${ConditionOpenItem.ItemUseNotHave}`)
//     if (ConditionOpenItem.LevelHave) TextArray.push(`- Level ที่ต้องมี: ${ConditionOpenItem.LevelHave}`)
//     if (ConditionOpenItem.LevelNotHave) TextArray.push(`- Level ที่ห้ามมี: ${ConditionOpenItem.LevelNotHave}`)
//     if (ConditionOpenItem.RoleHave) TextArray.push(`- Role ที่ต้องมี: ${ConditionOpenItem.RoleHave}`)
//     if (ConditionOpenItem.RoleNotHave) TextArray.push(`- Role ที่ห้ามมี: ${ConditionOpenItem.RoleNotHave}`)
//     if (ConditionOpenItem.Cooldown) TextArray.push(`- Cooldown: ${ConditionOpenItem.Cooldown}`)
//     if (ConditionOpenItem.PeriodUse) TextArray.push(`- ระยะเวลาเปิดใช้ (ร่าย): ${ConditionOpenItem.PeriodUse}`)
//     if (ConditionOpenItem.PreparationPeriod) TextArray.push(`- ระยะเวลาเตรียมตัว: ${ConditionOpenItem.PreparationPeriod}`)

//     Embed.addFields({ name: '❗ เงื่อนไขเปิดใช้ไอเทม', value: codeBlock('autohotkey', TextArray.join('\n')) })
// }

// const EmbedNotify = (Embed: EmbedBuilder, Notify: INotification) => {
//     const TextArray: string[] = ['┣───────────────────────────➤']

//     if (Notify.Message) Notify.Message.split('\n').forEach((text: string) => TextArray.push(`┃${text}`))

//     TextArray.push('╰───────────────────────────➤')

//     Embed.addFields({ name: `┍ ข้อความแสดงผลการแจ้งเตือน (${Notify.SeeAll ? 'เห็นทุกคน' : 'เฉพาะคุณ'})`, value: TextArray.join('\n') })
// }

// const EmbedConditionTarget = (Embed: EmbedBuilder, ConditionTarget: IConditionTarget) => {
//     const TextArray: string[] = []

//     if (ConditionTarget.AttackType) TextArray.push(`- ประเภทการโจมตี: ${ConditionTarget.AttackType == 'solo' ? 'เหดี่ยว' : 'กลุ่ม'}`)
//     if (ConditionTarget.CanEsc) TextArray.push(`- หลบหลีก: ${ConditionTarget.CanEsc ? 'Yes' : 'No'}`)
//     if (ConditionTarget.LevelLessUser) TextArray.push(`- ต้องมี Level น้อยกว่าผู้ใช้: ${ConditionTarget.LevelLessUser}`)
//     if (ConditionTarget.LevelMoreUser) TextArray.push(`- ต้องมี Level มากกว่าผู้ใช้: ${ConditionTarget.LevelMoreUser}`)
//     if (ConditionTarget.ItemUseHave) TextArray.push(`- ไอเทมสวมใส่ที่ต้องมี: ${ConditionTarget.ItemUseHave}`)
//     if (ConditionTarget.ItemUseNotHave) TextArray.push(`- ไอเทมสวมใส่ที่ห้ามมี: ${ConditionTarget.ItemUseNotHave}`)
//     if (ConditionTarget.LevelHave) TextArray.push(`- Level ที่ต้องมี: ${ConditionTarget.LevelHave}`)
//     if (ConditionTarget.LevelNotHave) TextArray.push(`- Level ที่ห้ามมี: ${ConditionTarget.LevelNotHave}`)
//     if (ConditionTarget.RoleHave) TextArray.push(`- Role ที่ต้องมี: ${ConditionTarget.RoleHave}`)
//     if (ConditionTarget.RoleNotHave) TextArray.push(`- Role ที่ห้ามมี: ${ConditionTarget.RoleNotHave}`)

//     Embed.addFields({ name: '‼ เงื่อนไขเป้าหมาย', value: codeBlock('autohotkey', TextArray.join('\n')) })
// }

// const EmbedPassive = (Embed: EmbedBuilder, Passive: IPassive) => {
//     const TextArray: string[] = []

//     if (Passive.StatusAge) TextArray.push(`- อายุสถานะ (d/h/m/s): ${Passive.StatusAge}`)
//     if (Passive.Tout) TextArray.push(`- Time out: ${Passive.Tout}`)
//     if (Passive.OverLap) TextArray.push(`- ใช้ใส่ทับกัน: ${Passive.OverLap ? 'Yes' : 'No'}`)
//     if (Passive.DeleteRole) TextArray.push(`- ถอด Role: ${Passive.DeleteRole}`)
//     if (Passive.GiveRole) TextArray.push(`- ให้ Role: ${Passive.GiveRole}`)
//     if (Passive.MPM) TextArray.push(`- MPM ความจุพลังจิต: ${Passive.MPM}`)
//     if (Passive.MM_p) TextArray.push(`- MM% ความจุพลังจิต: ${Passive.MM_p}%`)
//     if (Passive.HPM) TextArray.push(`- HPM ความจุเลือด: ${Passive.HPM}`)
//     if (Passive.HM_p) TextArray.push(`- HM% ความจุเลือด: ${Passive.HM_p}%`)
//     if (Passive.Tx) TextArray.push(`- Tx บ่มเพราะพลัง: ${Passive.Tx}`)
//     if (Passive.APHP) TextArray.push(`- APHP ดูดซับพลังสวรรค์: ${Passive.APHP}`)
//     if (Passive.APWP) TextArray.push(`- APWP ดูดซับพลังพิภพ: ${Passive.APWP}`)
//     if (Passive.HPR_p) TextArray.push(`- HPR ฟื้นฟูเลือด: ${Passive.HPR_p}%`)
//     if (Passive.MPR) TextArray.push(`- MPR ฟื้นฟูพลังจิต: ${Passive.MPR}%`)
//     if (Passive.SRP) TextArray.push(`- SRP% ภูมิต้านทาน: ${Passive.SRP}%`)
//     if (Passive.SPP) TextArray.push(`- SPP ความเร็วต่อสู้: ${Passive.SPP}`)
//     if (Passive.TSPP) TextArray.push(`- TSPP ความเร็วเดินทาง: ${Passive.TSPP}`)
//     if (Passive.CPP) TextArray.push(`- CPP ช่องเก็บของ: ${Passive.CPP}`)
//     if (Passive.DMP) TextArray.push(`- DM พลังโจมตี: ${Passive.DMP}`)
//     if (Passive.EVP_p) TextArray.push(`- EV การหลบหลีก: ${Passive.EVP_p}`)
//     if (Passive.ECP) TextArray.push(`- ECP การหลบหนี: ${Passive.ECP}%`)
//     if (Passive.MGP) TextArray.push(`- MR ต้านทานเวท: ${Passive.MGP}%`)
//     if (Passive.DM_p) TextArray.push(`- DM% พลังโจมตี: ${Passive.DM_p}%`)
//     if (Passive.EPH) TextArray.push(`- EPH พลังสวรรค์: ${Passive.EPH}`)
//     if (Passive.EPW) TextArray.push(`- EPW พลังพิภพ: ${Passive.EPW}`)
//     if (Passive.EP_p) TextArray.push(`- EP% เพิ่มลด EXP: ${Passive.EP_p}%`)
//     if (Passive.AMP) TextArray.push(`- AM พลังป้องกัน: ${Passive.AMP}`)
//     if (Passive.AM_p) TextArray.push(`- AM% พลังป้องกัน: ${Passive.AM_p}%`)

//     Embed.addFields({ name: '🅿 คุณสมบัติ Passive', value: codeBlock('autohotkey', TextArray.join('\n')) })
// }

// const EmbedActivate = (Embed: EmbedBuilder, Activate: IActivate) => {
//     const TextArray: string[] = []

//     if (Activate.EAH) TextArray.push(`- EAH พลังสวรรค์: ${Activate.EAH}`)
//     if (Activate.EAW) TextArray.push(`- EAW พลังพิภพ: ${Activate.EAW}`)
//     if (Activate.HGD) TextArray.push(`- HGD ความหิวน้ำ: ${Activate.HGD}`)
//     if (Activate.HGF) TextArray.push(`- HGF ความหิวอาหาร: ${Activate.HGF}`)
//     if (Activate.EXP) TextArray.push(`- EXP พลังวิญญาณ: ${Activate.EXP}`)
//     if (Activate.XPB) TextArray.push(`- XPB พลังวิญญาณ % XPs: ${Activate.XPB}`)
//     if (Activate.HP) TextArray.push(`- HP เพิ่มลด พลังชีวิต: ${Activate.HP}`)
//     if (Activate.HP_p) TextArray.push(`- HP% เพิ่มลด พลังชีวิต: ${Activate.HP_p}%`)
//     if (Activate.HPMax_p) TextArray.push(`- HPMax% พลังชีวิต % สูงสุด: ${Activate.HPMax_p}%`)
//     if (Activate.MP) TextArray.push(`- MP เพิ่มลด พลังจิต: ${Activate.MP}`)
//     if (Activate.MP_p) TextArray.push(`- MP% เพิ่มลด พลังจิต: ${Activate.MP_p}%`)
//     if (Activate.MPMax_p) TextArray.push(`- MPMax% พลังจิต % สูงสุด: ${Activate.MPMax_p}%`)
//     if (Activate.CancelAbnormalEffect) TextArray.push(`- ยกเลิกสถานะผิดปกติ: ${Activate.CancelAbnormalEffect}`)
//     if (Activate.CancelSpecialEffect) TextArray.push(`- ยกเลิกสถานะพิเศษ: ${Activate.CancelSpecialEffect}`)
//     if (Activate.MuteServer) TextArray.push(`- ปิดเสียงเซิฟเวอร์: ${Activate.MuteServer ? 'Yes' : 'No'}`)
//     if (Activate.UnmuteServer) TextArray.push(`- เปิดเสียงเซิฟเวอร์: ${Activate.UnmuteServer ? 'Yes' : 'No'}`)
//     if (Activate.MuteHeadsets) TextArray.push(`- ปิดเสียงหูฟัง: ${Activate.MuteHeadsets ? 'Yes' : 'No'}`)
//     if (Activate.UnmuteHeadsets) TextArray.push(`- เปิดเสียงหูฟัง: ${Activate.UnmuteHeadsets ? 'Yes' : 'No'}`)
//     if (Activate.GiveRole) TextArray.push(`- ให้ Role: ${Activate.GiveRole}`)
//     if (Activate.DeleteRole) TextArray.push(`- ถอด Role: ${Activate.DeleteRole}`)
//     if (Activate.KickUser) TextArray.push(`- แตะออกจากห้อง: ${Activate.KickUser ? 'Yes' : 'No'}`)

//     Embed.addFields({ name: '🅰 คุณสมบัติ Activate', value: codeBlock('autohotkey', TextArray.join('\n')) })
// }

// const EmbedATphysical = (Embed: EmbedBuilder, ATphysical: IATphysical) => {
//     const TextArray: string[] = []

//     if (ATphysical.Enable) TextArray.push(`- สามารถป้องกันได้: ${ATphysical.Enable ? 'Yes' : 'No'}`)
//     if (ATphysical.ATHP) TextArray.push(`- ATHP: ${ATphysical.ATHP}`)
//     if (ATphysical.ATHPx) TextArray.push(`- ATHPx: ${ATphysical.ATHPx}`)
//     if (ATphysical.ATHP_p) TextArray.push(`- ATHP%: ${ATphysical.ATHP_p}`)
//     if (ATphysical.ATHPMax_p) TextArray.push(`- ATHPMax%%: ${ATphysical.ATHPMax_p}`)
//     if (ATphysical.ATMP) TextArray.push(`- ATMP: ${ATphysical.ATMP}`)
//     if (ATphysical.ATMPx) TextArray.push(`- ATMPx: ${ATphysical.ATMPx}`)
//     if (ATphysical.ATMP_p) TextArray.push(`- ATMP%: ${ATphysical.ATMP_p}`)
//     if (ATphysical.ATMPMax_p) TextArray.push(`- ATMPMax%%: ${ATphysical.ATMPMax_p}`)

//     Embed.addFields({ name: '⚔ โจมตีกายภาพ', value: codeBlock('autohotkey', TextArray.join('\n')) })
// }

// const EmbedATmagic = (Embed: EmbedBuilder, ATmagic: IATmagic) => {
//     const TextArray: string[] = []

//     if (ATmagic.Enable) TextArray.push(`- สามารถป้องกันได้: ${ATmagic.Enable ? 'Yes' : 'No'}`)
//     if (ATmagic.ATHP) TextArray.push(`- ATHP: ${ATmagic.ATHP}`)
//     if (ATmagic.ATHPx) TextArray.push(`- ATHPx: ${ATmagic.ATHPx}`)
//     if (ATmagic.ATHP_p) TextArray.push(`- ATHP%: ${ATmagic.ATHP_p}`)
//     if (ATmagic.ATHPMax_p) TextArray.push(`- ATHPMax%%: ${ATmagic.ATHPMax_p}`)
//     if (ATmagic.ATMP) TextArray.push(`- ATMP: ${ATmagic.ATMP}`)
//     if (ATmagic.ATMPx) TextArray.push(`- ATMPx: ${ATmagic.ATMPx}`)
//     if (ATmagic.ATMP_p) TextArray.push(`- ATMP%: ${ATmagic.ATMP_p}`)
//     if (ATmagic.ATMPMax_p) TextArray.push(`- ATMPMax%%: ${ATmagic.ATMPMax_p}`)

//     Embed.addFields({ name: '⚡โจมตีเวท', value: codeBlock('autohotkey', TextArray.join('\n')) })
// }

// export const InfoExecute = async (client: Client, UserId: string, ItemId: string): Promise<MessageCreateOptions | InteractionReplyOptions> => {
//     if (!ItemId) return { content: '❌ กรุณาใส่ไอดีไอเทม' }

//     const [Item, isItem] = await Promise.all([
//         await client.Database.Items.findOne({ 'Base.ItemId': ItemId }) as any,
//         await client.Database.Inventorys.findOne({ UserId: UserId, ItemId: ItemId }) as any as ItemBase[]
//     ])

//     if (!Item) return { content: '❌ ไม่พบไอเทม' }
//     if (!isItem) return { content: '❌ คุณไม่มีไอเทมนี้' }

//     let Embed = new EmbedBuilder()
//         .setTitle('📋รายละเอียด และคุณสมบัติไอเทม')
//         .setDescription(`**${Item.Base.ItemId} ${Item.Base.EmojiId ? Item.Base.EmojiId : ''} ${Item.Base.ItemName}**`)

//     if (Item.Base) EmbedBase(Embed, Item)
//     if (Item.CondionOpenItem) EmbedConditionOpenItem(Embed, Item.CondionOpenItem)
//     if (Item.Notify) EmbedNotify(Embed, Item.Notify)
//     if (Item.ConditionTarget) EmbedConditionTarget(Embed, Item.ConditionTarget)
//     if (Item.Passive) EmbedPassive(Embed, Item.Passive)
//     if (Item.Activate) EmbedActivate(Embed, Item.Activate)
//     if (Item.ATphysical) EmbedATphysical(Embed, Item.ATphysical)
//     if (Item.ATmagic) EmbedATmagic(Embed, Item.ATmagic)

//     return { embeds: [Embed] }
// }