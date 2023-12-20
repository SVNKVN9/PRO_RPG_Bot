export interface IMoney {
    OnlineMore: number
    GiveMoney: number
}

export interface IItemSelect {
    ItemId: string,
    Count: number,
    Text: string,
    Color: string,
    Equip: boolean
}

export interface IRandomItem {
    ItemId: string
    Count: number
    Maxcount: number
    Counted: number
    Probability: number
}

export interface IRandomCount {
    OnlineMore: number
    Count: number
}

export interface IItemReward {
    ItemId: string,
    Count: number,
}

export interface ILevel {
    LevelNo: string
    LevelName: string
    Image: { preview: string, data?: File }
    RoleOne: string
    RoleTwo: string
    RoleThree: string
    ChannelId: string
    EXPNeed: string
    XPs: string
    HPL: string
    MPL: string
    DML: string
    AML: string
    SRL: string
    SPL: string
    TSPL: string
    PARL: string
    CPL: string
    Money: IMoney[]
    RandomCount: IRandomCount[]
    RandomItem: IRandomItem[]
    ItemSelect: IItemSelect[]
    ItemReward: IItemReward[]
}