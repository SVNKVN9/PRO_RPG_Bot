export enum CareType {
    Amount = 'Amount',
    Chance = 'Chance',
    Product = 'Product'
}

export interface FarmCare {
    FarmId: string
    ItemId: string
    type: CareType
    EffectTimeout: number
    nextTime: number
}

export interface FarmDetail {
    ItemId: string
    Counted: number
    MaxCount: number
    CropPerTime: number
    startTime: number
    resetTime: number
    expireTime: number
}

export interface FarmOptions {
    Id: string,
    ChannelId: string
    MessageId: string
    VoiceId: string
    ItemId: string
    Timeout: number
    Items: FarmDetail[]
}

export interface FarmChannel {
    Id: string
    size: number
    FarmIds: string[]
}

export interface FarmUser {
    UserId: string
    FarmId: string
    ItemId: string
    Counted: number
    Timeout: number
}

export interface IFarmEmbed {
    Name?: string
    Description?: string
    ImageURL?: string
}

export interface IFarmProperties {
    Age?: string
    Area?: string
    HP?: string
}

export interface IConditionFarm {
    MPUse?: string
    MPUse_p?: string
    ItemUseHave?: string
    ItemUseNotHave?: string
    LevelHave?: string
    LevelNotHave?: string
    RoleHave?: string
    RoleNotHave?: string
    Cooldown?: string
    XPA?: string
    HGD?: string
    HGF?: string
}

export const LessThenEqual = '<='
export const Equal = '=='
export const GreaterThenEqual = '>='
export const Condition = `${LessThenEqual} ${Equal} ${GreaterThenEqual}`

export type ConditionType = '<=' | '==' | '>='

export interface ICareItem {
    ItemId?: string
    Condition?: ConditionType
    Amount?: string
    AddOrSubtract?: string
    EffectTime?: string
    CareTime?: string
}

interface Base {
    Period?: string
    Time?: string
    CareItem?: ICareItem[]
}

export interface IAmount extends Base {
    Amount?: string,
    AddOrSubtract?: string
}

export interface IChance extends Base {
    Chance?: string
    AddOrSubtract?: string
}

export interface IProduct extends Base {
    Product?: string
    AddOrSubtract?: string
}

export interface FarmRandom {
    ItemId?: string
    CropTime?: string
    ExpireTime?: string
    GiveCount?: string
    DisableDescription?: boolean

    Crop_User?: string
    InTime_User?: string
    AddOrSubtract_User?: string
    Period_User?: string
    Times_User?: string

    Crop_Global?: string
    InTime_Global?: string
    AddOrSubtract_Global?: string
    Period_Global?: string
    Times_Global?: string

    Amount?: IAmount
    Chance?: IChance
    Product?: IProduct
} 