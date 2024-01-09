import { CommandInteraction, GuildMember, MessageCreateOptions } from "discord.js"

export type StatusType = {
    isEnd: boolean
    message?: MessageCreateOptions
    HPUse?: number
    MPUse?: number
    
    HPAtt?: number
    MPAtt?: number
}

import { FarmRandom, IConditionFarm, IFarmEmbed, IFarmProperties } from "."
import Client from "../structure/Client"
import { ItemBase } from "."

type CommandMe = 'use' | 'ulti' | 'eat' | 'drink' | 'build'
type CommandAccept = 'ass'
type CommandNotAccept = 'att' | 'sup'
export type Command = CommandMe | CommandAccept | CommandNotAccept

export interface ItemParameter {
    client: Client
    Member: GuildMember,
    ItemTarget: ItemBase
    interaction: CommandInteraction
    Target?:  GuildMember
    AcceptCheck?: boolean
}
// Base

export interface IBase {
    ItemId: string
    EmojiId?: string
    ItemName?: string
    Image?: string
    ItemAge?: string
    Size?: string
    Weight?: string
    Description?: string
}


export interface ExtendBase extends IBase {
    RefItemId?: string
}

// Quality

export interface ItemQuality {
    Enable?: boolean
    Quality?: string
    StartQuality?: string
    LowQuality?: string
    HighQuality?: string
}

export interface Durability extends ItemQuality {
    LowLimitHP?: string
    LowDegenerate?: string
    HighLimitHP?: string
    HighDegenerate?: string
}

// Activate Passive 

export interface BaseServerSetting {
    GiveRoleIds?: string[]
    GiveRoleNames?: string[]
    TakeRoleIds?: string[]
    TakeRoleNames?: string[]
}

export interface ActivateServerSetting extends BaseServerSetting {
    MuteServer?: boolean
    MuteHeadsets?: boolean
    UnmuteServer?: boolean
    UnmuteHeadsets?: boolean
    Disconnect?: boolean
}

export interface DefaultActivate {
    HP?: string
    HM_p?: string
    HP_p?: string
    MP?: string
    MP_p?: string
    MPMax?: string
    HGD?: string
    HGF?: string
    EAH?: string
    EAW?: string
    EXP?: string
    XPB?: string
    RemoveEquips?: string[]
    RemovePassive?: { ItemId: string, Time: string }[]
    AdjustEquips?: { ItemId: string, Property: string }[]
}

export interface AttackActivate {
    Defend?: boolean
    ATHP?: string
    ATHPx?: string
    ATHP_p?: string
    ATHPMax_p?: string
    ATMP?: string
    ATMPx?: string
    ATMP_p?: string
    ATMPMax_p?: string
}

export interface Activate {
    ServerSetting?: ActivateServerSetting
    Default?: DefaultActivate

    DecreaseTime?: boolean
    DecreaseQuality?: boolean

    Venom?: AttackActivate
    IPhysical?: AttackActivate
    OPhysical?: AttackActivate
    Magic?: AttackActivate
    Dirt?: AttackActivate
    Water?: AttackActivate
    Wind?: AttackActivate
    Fire?: AttackActivate
    Lighting?: AttackActivate
    Ice?: AttackActivate
}

export interface PassiveServerSetting extends BaseServerSetting {
    Timeout?: boolean
    MuteServer?: boolean
    MuteHeadsets?: boolean
}

export type EquipType = 'OverLap' | 'Stack' | 'NonStack'
export type DecreaseAttribute = 'RPO' | 'REX' | 'RIN' | 'RHE' | 'RCO'

export class EquipPos {
    // AB
    static readonly GeneralTips = new EquipPos('💥 วรยุทธ์', 'general_tips')
    static readonly Wing = new EquipPos('🦋 ปีกบิน', 'wing')
    static readonly MainWeapon = new EquipPos('⚔️ อาวุธหลัก', 'main_weapon')
    static readonly SecretWeapon = new EquipPos('🗡️ อาวุธลับ', 'secret_weapon')
    static readonly ItemUse = new EquipPos('🅰 ไอเทมกดใช้', 'item_use')
    static readonly ItemTransFrom = new EquipPos('🐉 ร่างแปลง', 'item_transfrom')

    // PA
    static readonly AbnormalEffect = new EquipPos('💀 สถานะผิดปกติ', 'abnormal_effect')
    static readonly SpecialEffect = new EquipPos('❓ สถานะพิเศษ', 'special_effect')
    static readonly Wound = new EquipPos('🩹 บาดแผล', 'wound')
    static readonly CultivationTechnique = new EquipPos('📚 ตำราบ่มเพาะพลัง', 'cultivation_Technique')
    static readonly CultivationEnhancement = new EquipPos('💊 โอสถบ่มเพาะพลัง', 'cultivation_enhancement')

    // P
    static readonly SecretTechnique = new EquipPos('🧘 เคล็ดวิชา', 'secret_technique')
    static readonly ItemDecoration = new EquipPos('📿 เครื่องประดับ', 'item_decoration')
    static readonly Emblem = new EquipPos('💠 ตราสัญลักษณ์', 'emblem')
    static readonly ItemSecret = new EquipPos('🅿 ไอเทมลับ', 'item_Secret')
    static readonly Race = new EquipPos('👥 เผ่าพันธ์', 'race')
    static readonly Blood = new EquipPos('🩸 สายเลือด', 'blood')
    static readonly PersonalElement = new EquipPos('✡️ ธาตุ', 'personal_element')
    static readonly SuperPower = new EquipPos('☯️ พลังพิเศษ', 'super_power')

    // PD
    static readonly Armor = new EquipPos('🥼  ชุดสวมใส่', 'armor')

    // F
    static readonly Farm = new EquipPos('🌱เมล็ดพันธุ์', 'farm')

    // ...
    static readonly Common = new EquipPos('ไอเทมทั่วไป', 'common')

    public title: string
    public type: string

    constructor(title: string, type: string) {
        this.title = title
        this.type = type
    }
}

export interface Passive {
    StatusAge?: string
    EquipType?: EquipType
    EquipPos: string 
    // DecreaseAttribute?: DecreaseAttribute

    AutoExec?: string
    ServerSetting?: PassiveServerSetting

    HPM?: string
    HM_p?: string
    MPM?: string
    MM_p?: string

    HD_p?: string
    HR_p?: string
    MD_p?: string
    MR_p?: string

    HDm?: string
    HRm?: string
    MDm?: string
    MRm?: string
    
    WE?: string
    DM?: string
    AM?: string
    Tx?: string

    ACC?: string
    DM_p?: string
    AM_p?: string
    APH?: string
    
    EVA?: string
    IMM?: string
    CP?: string
    APW?: string

    ATS?: string
    PoR?: string
    SCR?: string
    EPH?: string

    MOS?: string
    IPR?: string
    ICR?: string
    EPW?: string

    VIS?: string
    MaR?: string
    MaD?: string
    XPT?: string
    
    INS?: string
    EP_p?: string

    EaD?: string
    EaR?: string
    WaD?: string
    WaR?: string

    AiD?: string
    AiR?: string
    FiD?: string
    FiR?: string

    LiD?: string
    LiR?: string
    IcD?: string
    IcR?: string
    SMS?: string
    REF?: string

    DisableUse?: boolean
    DisableSkill?: boolean
}

// Condition

export enum UseCondition {
    MustHaveOne = 'MustHaveOne',
    FullOption = 'FullOption',
}

interface BaseCondition {
    UseCondition: UseCondition
    ServerIds?: string[]
    UserIds?: string[]
    Wearables?: string[]
    RoleIds?: string[]
    RoleNames?: string[]
}

export interface ConditionRequire extends BaseCondition {
    HP?: string
    MP?: string
    HGF?: string
    Level?: string
    HP_p?: string
    MP_p?: string
    HGD?: string
}

export interface ConditionNotRequire extends BaseCondition {
    Level?: string
}

export interface ConditionTradeOrInfo extends BaseCondition {
    EveryOneCan?: boolean
}

export interface TypeUse {
    Me?: boolean
    MeMessage?: string
    Accept?: boolean
    AcceptMessage?: string
    NotAccept?: boolean
    NotAcceptMessage?: string
    Farm?: boolean
    FarmMessage?: string
}

export interface Notify {
    EveryOneCanSee?: boolean
    Title?: string
    Countdown?: string
    Me?: string
    Accept?: string
    NotAccept?: string
    Farm?: string
    Image?: string
}

export interface ConditionItem {
    EveryOneCanUse?: boolean
    Deterioration?: string
    TypeUse?: TypeUse
    Cooldown?: string
    PeriodUse?: string
    PeriodUseMessage?: Notify
    PreparationPeriod?: string
    PreparationPeriodMessage?: Notify
    FinishMessage?: Notify
    HP?: string
    HP_p?: string
    MP?: string
    MP_p?: string
    EXP?: string
    XPS?: string
    EAH?: string
    EAW?: string
    ConditionRequire?: ConditionRequire
    ConditionNotRequire?: ConditionNotRequire
}

export enum TargetType {
    Solo = 'Solo',
    Group = 'Group'
}
export enum Evasion {
    NONE = 'NONE',
    EVA = 'EVA',
    IMM = 'IMM'
}

export interface ConditionTarget {
    TargetType?: TargetType
    Evasion?: Evasion
    ConditionRequire?: ConditionRequire
    ConditionNotRequire?: ConditionNotRequire
}

// Type

export type ItemsType = TypeAB | TypeB | TypePA | TypeP | TypePD | TypeF

// export type MainType = 'AB' | 'B' | 'PA' | 'P' | 'PD' | 'F'
export enum MainTypeEnum {
    AB = 'AB',
    B = 'B',
    PA = 'PA',
    P = 'P',
    PD = 'PD',
    F = 'F'
}

export interface BaseExtend {
    ItemId?: string
    EmojiId?: string
    ItemName?: string
}

export interface AutoExec {
    HPp_LessThan?: string
    HP_LessThan?: string
    MPP_LessThan?: string
    MP_LessThan?: string
    HPAtt?: boolean
    MPAtt?: boolean
    VoiceJoin?: boolean
    UseThree?: boolean
}

interface ItemExtend {
    AutoExec: AutoExec
    ConditionItem: ConditionItem
    PassiveMe: Passive
    ConditionTarget: ConditionTarget
    PassiveTarget: Passive
    Activate: Activate
}

interface ABExtends extends BaseExtend, ItemExtend { }

export interface TypeAB {
    Type: MainTypeEnum.AB
    Base: IBase
    Quality: ItemQuality
    ConditionTrade: ConditionTradeOrInfo
    ConditionInfo: ConditionTradeOrInfo
    ConditionItem: ConditionItem
    PassiveMe: Passive
    Extend: ABExtends
}

export interface TypeB {
    Type: MainTypeEnum.B
    Base: ExtendBase
    ConditionTrade: ConditionTradeOrInfo
    ConditionInfo: ConditionTradeOrInfo
    ConditionItem: ConditionItem
    PassiveMe: Passive
    Extend: ItemExtend
}

export interface TypePA {
    Type: MainTypeEnum.PA
    Base: IBase
    Quality: ItemQuality
    ConditionTrade: ConditionTradeOrInfo
    ConditionInfo: ConditionTradeOrInfo
    ConditionItem: ConditionItem
    ConditionTarget: ConditionTarget
    PassiveTarget: Passive
    Activate: Activate
}

export interface TypeP {
    Type: MainTypeEnum.P
    Base: IBase
    Quality: ItemQuality
    ConditionTrade: ConditionTradeOrInfo
    ConditionInfo: ConditionTradeOrInfo
    ConditionItem: ConditionItem
    PassiveTarget: Passive
}

export interface TypePD {
    Type: MainTypeEnum.PD
    Base: IBase
    Durability: Durability
    ConditionTrade: ConditionTradeOrInfo
    ConditionInfo: ConditionTradeOrInfo
    ConditionItem: ConditionItem
    PassiveTarget: Passive
}

export interface TypeF {
    Type: MainTypeEnum.F
    Base: IBase
    ConditionItem: ConditionItem
    FarmEmbed: IFarmEmbed
    FarmProperties: IFarmProperties
    FarmCondition: IConditionFarm
    FarmRandom: FarmRandom[]
}