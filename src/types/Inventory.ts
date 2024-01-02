import { ObjectId } from "mongodb"

export interface ItemBase {
    _id: ObjectId
    UserId: string
    ItemId: string 
    ItemDate: string
    ItemCount: number
    CreateTimestramp: number
    Quality: number
    Locked: boolean
    Select: boolean
}

export interface ItemEquip extends ItemBase {
    TimeOut: number
}