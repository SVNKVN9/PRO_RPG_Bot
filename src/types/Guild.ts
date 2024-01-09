export interface IGuild {
    id: string
    name: string
    iconURL: string
    TxActivate: boolean
    TxValue: number
    Trade: boolean
    isVs: boolean
    isAttack: boolean
    KickWhenDie: boolean
    Timeout: boolean 
    KickWhenJoin: boolean
    KickWhenMove: boolean
}