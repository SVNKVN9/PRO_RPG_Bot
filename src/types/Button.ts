export enum ButtonType {
    Money = 'Money',
    Random = 'Random',
    Select = 'Select',
    Reward = 'Reward'
} 

export interface ButtonBase {
    Id: string
    UserId: string
    Timeout: number
}

export interface ButtonMoney extends ButtonBase {
    Type: ButtonType.Money
    Amount: number
}

export interface ButtonRandom extends ButtonBase {
    Type: ButtonType.Random
    Level: string
    Count: number
}

export interface ButtonSelect extends ButtonBase {
    Type: ButtonType.Select
    ItemId: string
    Count: number
    Equip: boolean
}

export interface ButtonReward extends ButtonBase {
    Type: ButtonType.Reward
    Level: string
}
