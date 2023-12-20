import { ObjectId } from 'mongodb'

interface IStats {
    LevelMax: number
    level: number
    time: number
    exp: number
    tx: number
    EAH: number
    EAW: number
    HGD: { value: number, UpdateLast: number }
    HGF: { value: number, UpdateLast: number }
    HP: { value: number, UpdateLast: number }
    MP: { value: number, UpdateLast: number }
    PS: number
    score: number
    HEA: { value: number, UpdateLast: number }
    STR: number
    END: number
    AGI: number
    ING: number
}

export interface BirthPoint {
    _id: ObjectId,
    name: string
    guildId: string,
    channelId: string
    roleId: string
} 

export interface IUser {
    UserId: string
    cash: number
    stats: IStats
    suspend: boolean
    verification: boolean
    birthpoint: ObjectId | undefined
    alive: boolean
}

export interface ICooldown {
    UserId: string
    ItemId: string
    Timeout: number
}
