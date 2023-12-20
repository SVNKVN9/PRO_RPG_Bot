export interface IGuild {
    id: string
    prefix: string
    slashcommand: boolean
    TxActivate: boolean
    TxValue: string
    Trade: boolean
    Attack: boolean
    KickWhenDie: boolean
    KickWhenMove: boolean
}