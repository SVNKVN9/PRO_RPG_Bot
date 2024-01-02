import { Passive, ILevel, ItemEquip, IUser, MainTypeEnum, TypeAB, TypeB, TypePA, TypeP, TypePD } from '../types'
import Client from "../structure/Client";

interface BaseVar {
    HPM: number;
    HM_p: number;
    MPM: number;
    MM_p: number;
    HD_p: number;
    HR_p: number;
    MD_p: number;
    MR_p: number;
    HDm: number;
    HRm: number;
    MDm: number;
    MRm: number;
    WE: number;
    DMP: number;
    AMP: number;
    Tx: number;
    ACC: number;
    DM_p: number;
    AM_p: number;
    APH: number;
    EVA: number;
    IMM: number;
    CP: number;
    APW: number;
    ATS: number;
    PoR: number;
    SCR: number;
    EPH: number;
    MOS: number;
    IPR: number;
    ICR: number;
    EPW: number;
    VIS: number;
    MaR: number;
    MaD: number;
    XPT: number;
    INS: number;
    EP_p: number;
    EaD: number;
    EaR: number;
    WaD: number;
    WaR: number;
    AiD: number;
    AiR: number;
    FiD: number;
    FiR: number;
    LiD: number;
    LiR: number;
    IcD: number;
    IcR: number;
    SMS: number
    REF: number
}

interface CalReturn extends BaseVar {
    HPMax: number,
    HP_p: number
    HPR: number
    HPT: number

    MPMax: number
    MP_p: number
    MPR: number
    MPT: number

    WEI: number
    WE1: number

    AM: number
    DM: number
    ATT: number

    SMS: number
    REF: number
}

export default async (client: Client, user: IUser, level: ILevel): Promise<CalReturn> => {
    let variable: BaseVar = {
        HPM: 0,
        HM_p: 0,
        MPM: 0,
        MM_p: 0,
        HD_p: 0,
        HR_p: 0,
        MD_p: 0,
        MR_p: 0,
        HDm: 0,
        HRm: 0,
        MDm: 0,
        MRm: 0,
        WE: 0,
        DMP: 0,
        AMP: 0,
        Tx: 0,
        ACC: 0,
        DM_p: 0,
        AM_p: 0,
        APH: 0,
        EVA: 0,
        IMM: 0,
        CP: 0,
        APW: 0,
        ATS: 0,
        PoR: 0,
        SCR: 0,
        EPH: 0,
        MOS: 0,
        IPR: 0,
        ICR: 0,
        EPW: 0,
        VIS: 0,
        MaR: 0,
        MaD: 0,
        XPT: 0,
        INS: 0,
        EP_p: 0,
        EaD: 0,
        EaR: 0,
        WaD: 0,
        WaR: 0,
        AiD: 0,
        AiR: 0,
        FiD: 0,
        FiR: 0,
        LiD: 0,
        LiR: 0,
        IcD: 0,
        IcR: 0,
        SMS: 0,
        REF: 0,
    };

    const Equips: ItemEquip[] = await client.Database.Equips.find({ UserId: user.UserId }).toArray() as any
    const Effects: ItemEquip[] = await client.Database.Effect.find({ UserId: user.UserId }).toArray() as any

    const Calculate = (Passive: Passive, Quality: number) => {
        if (!Quality) Quality = 100

        const QualityResult = Quality / 100

        if (Passive.HPM) variable.HPM += parseFloat(Passive.HPM) * QualityResult;
        if (Passive.HM_p) variable.HM_p += parseFloat(Passive.HM_p) * QualityResult;
        if (Passive.MPM) variable.MPM += parseFloat(Passive.MPM) * QualityResult;
        if (Passive.MM_p) variable.MM_p += parseFloat(Passive.MM_p) * QualityResult;
        if (Passive.HD_p) variable.HD_p += parseFloat(Passive.HD_p) * QualityResult;
        if (Passive.HR_p) variable.HR_p += parseFloat(Passive.HR_p) * QualityResult;
        if (Passive.MD_p) variable.MD_p += parseFloat(Passive.MD_p) * QualityResult;
        if (Passive.MR_p) variable.MR_p += parseFloat(Passive.MR_p) * QualityResult;
        if (Passive.HDm) variable.HDm += parseFloat(Passive.HDm) * QualityResult;
        if (Passive.HRm) variable.HRm += parseFloat(Passive.HRm) * QualityResult;
        if (Passive.MDm) variable.MDm += parseFloat(Passive.MDm) * QualityResult;
        if (Passive.MRm) variable.MRm += parseFloat(Passive.MRm) * QualityResult;
        if (Passive.WE) variable.WE += parseFloat(Passive.WE) * QualityResult;
        if (Passive.DM) variable.DMP += parseFloat(Passive.DM) * QualityResult;
        if (Passive.AM) variable.AMP += parseFloat(Passive.AM) * QualityResult;
        if (Passive.Tx) variable.Tx += parseFloat(Passive.Tx) * QualityResult;
        if (Passive.ACC) variable.ACC += parseFloat(Passive.ACC) * QualityResult;
        if (Passive.DM_p) variable.DM_p += parseFloat(Passive.DM_p) * QualityResult;
        if (Passive.AM_p) variable.AM_p += parseFloat(Passive.AM_p) * QualityResult;
        if (Passive.APH) variable.APH += parseFloat(Passive.APH) * QualityResult;
        if (Passive.EVA) variable.EVA += parseFloat(Passive.EVA) * QualityResult;
        if (Passive.IMM) variable.IMM += parseFloat(Passive.IMM) * QualityResult;
        if (Passive.CP) variable.CP += parseFloat(Passive.CP) * QualityResult;
        if (Passive.APW) variable.APW += parseFloat(Passive.APW) * QualityResult;
        if (Passive.ATS) variable.ATS += parseFloat(Passive.ATS) * QualityResult;
        if (Passive.PoR) variable.PoR += parseFloat(Passive.PoR) * QualityResult;
        if (Passive.SCR) variable.SCR += parseFloat(Passive.SCR) * QualityResult;
        if (Passive.EPH) variable.EPH += parseFloat(Passive.EPH) * QualityResult;
        if (Passive.MOS) variable.MOS += parseFloat(Passive.MOS) * QualityResult;
        if (Passive.IPR) variable.IPR += parseFloat(Passive.IPR) * QualityResult;
        if (Passive.ICR) variable.ICR += parseFloat(Passive.ICR) * QualityResult;
        if (Passive.EPW) variable.EPW += parseFloat(Passive.EPW) * QualityResult;
        if (Passive.VIS) variable.VIS += parseFloat(Passive.VIS) * QualityResult;
        if (Passive.MaR) variable.MaR += parseFloat(Passive.MaR) * QualityResult;
        if (Passive.MaD) variable.MaD += parseFloat(Passive.MaD) * QualityResult;
        if (Passive.XPT) variable.XPT += parseFloat(Passive.XPT) * QualityResult;
        if (Passive.INS) variable.INS += parseFloat(Passive.INS) * QualityResult;
        if (Passive.EP_p) variable.EP_p += parseFloat(Passive.EP_p) * QualityResult;
        if (Passive.EaD) variable.EaD += parseFloat(Passive.EaD) * QualityResult;
        if (Passive.EaR) variable.EaR += parseFloat(Passive.EaR) * QualityResult;
        if (Passive.WaD) variable.WaD += parseFloat(Passive.WaD) * QualityResult;
        if (Passive.WaR) variable.WaR += parseFloat(Passive.WaR) * QualityResult;
        if (Passive.AiD) variable.AiD += parseFloat(Passive.AiD) * QualityResult;
        if (Passive.AiR) variable.AiR += parseFloat(Passive.AiR) * QualityResult;
        if (Passive.FiD) variable.FiD += parseFloat(Passive.FiD) * QualityResult;
        if (Passive.FiR) variable.FiR += parseFloat(Passive.FiR) * QualityResult;
        if (Passive.LiD) variable.LiD += parseFloat(Passive.LiD) * QualityResult;
        if (Passive.LiR) variable.LiR += parseFloat(Passive.LiR) * QualityResult;
        if (Passive.IcD) variable.IcD += parseFloat(Passive.IcD) * QualityResult;
        if (Passive.IcR) variable.IcR += parseFloat(Passive.IcR) * QualityResult;
        if (Passive.SMS) variable.SMS += parseFloat(Passive.SMS) * QualityResult;
        if (Passive.REF) variable.REF += parseFloat(Passive.REF) * QualityResult;
    }

    let WE1 = 0
    const now = Date.now()

    const ProcessItem = async (Item: ItemEquip) => {
        const ItemData = await client.Database.Items(Item.ItemId)

        if (!ItemData) return

        if  (ItemData.Type == 'AB') {
            const PassiveMe = ItemData.Extend.PassiveMe
            const PassiveTarget = ItemData.Extend.PassiveTarget

            if (PassiveMe) Calculate(PassiveMe, Item.Quality)
            if (PassiveTarget) Calculate(PassiveTarget, Item.Quality)
        }

        const PassiveMe = (ItemData as TypeAB | TypeB).PassiveMe

        if (PassiveMe) Calculate(PassiveMe, Item.Quality)

        const PassiveTarget = (ItemData as TypePA | TypeP | TypePD).PassiveTarget

        if (PassiveTarget) Calculate(PassiveTarget, Item.Quality)

        if (ItemData.Base.Weight) WE1 += parseFloat(ItemData.Base.Weight)
    }

    for (let Item of Equips) {
        if (Item.TimeOut && Item.TimeOut < now) {
            await client.Database.Equips.deleteOne({ UserId: user.UserId, ItemId: Item.ItemId })

            continue
        }

        await ProcessItem(Item)
    }

    for (let Item of Effects) {
        if (Item.TimeOut && Item.TimeOut < now) {
            await client.Database.Effect.deleteOne({ UserId: user.UserId, ItemId: Item.ItemId })

            continue
        }

        await ProcessItem(Item)
    }

    if (!user.stats.END) await client.Database.Users.updateOne({ UserId: user.UserId }, { $set: { 'stats.END': 0 } })
    if (!user.stats.HEA) await client.Database.Users.updateOne({ UserId: user.UserId }, { $set: { 'stats.HEA': { value: 100, UpdateLast: now } } })
    if (!user.stats.STR) await client.Database.Users.updateOne({ UserId: user.UserId }, { $set: { 'stats.STR': 0 } })

    const END = user.stats.END ? user.stats.END : 0
    const HEA = user.stats.HEA ? user.stats.HEA.value : 100
    const STR = user.stats.STR ? user.stats.STR : 0

    let HPMax = parseFloat(level.HPL) + variable.HPM + ((parseFloat(level.HPL) / 100) * (variable.HM_p + (0.03 * END)))
    let HP_p = (user.stats.HP.value / HPMax) * 100

    let MPMax = parseFloat(level.MPL) + variable.MPM + ((parseFloat(level.MPL) / 100) * (variable.MM_p + (0.03 * user.stats.ING)))
    let MP_p = (user.stats.MP.value / MPMax) * 100

    let HPR = 0
    let MPR = 0

    if (variable.HDm + variable.HD_p > 0) HPR = (-variable.HDm + (HPMax / 100) * (-variable.HD_p / 1440))
    else HPR = (25 + (0.02 * END) + variable.HRm + (HPMax / 100) * (variable.HR_p / 1400))

    if (variable.MDm + variable.MD_p > 0) MPR = (-variable.MDm + (MPMax / 100) * (-variable.MD_p / 1440))
    else MPR = (25 + (0.02 * user.stats.ING) + variable.MRm + (MPMax / 100) * (variable.MR_p / 1400))

    const HPT = (HPMax / 100) * (HPR / 1440)
    const MPT = (MPMax / 100) * (MPR / 1440)

    const DM_HEA = (parseFloat(level.DML) / 100 * HEA)
    const DM = variable.DMP + DM_HEA + (DM_HEA / 100 * (variable.DM_p + (0.1 * STR)))

    const AM_HEA = (parseFloat(level.AML) / 100 * HEA)
    const AM = variable.AMP + AM_HEA + (AM_HEA / 100 * variable.AM_p)

    let WEI = WE1 + variable.WE
    if (WEI <= 0) WEI = 0

    let IMM = (variable.IMM / 100) * HEA

    if (IMM >= 100) IMM = 100
    if (IMM <= 0) IMM = 0

    let ACC = (((0.1 * user.stats.STR) + variable.ACC) / 100) * HEA
    if (ACC >= 100) ACC = 100
    if (ACC <= 0) ACC = 0

    let EVA = (user.stats.AGI * 0.008) + (-WEI * 0.15) + variable.EVA
    if (EVA <= 0) EVA = 0
    if (EVA >= 100) EVA = 100

    let ATS = (parseFloat(level.SPL) / 100 * HEA) + (user.stats.AGI * 0.008) + variable.ATS
    if (ATS >= 100) ATS = 100
    if (ATS <= 0) ATS = 0

    const ATT = (650 - ATS) / 100

    const MOS = (parseFloat(level.TSPL) / 100 * HEA) + (user.stats.AGI * 0.02) + variable.MOS
    const SMS = (HEA * 0.1) + (user.stats.AGI * 0.001) + variable.SMS

    let APH = (parseFloat(level.PARL) * 0.4) + variable.APH
    let APW = (parseFloat(level.PARL) * 0.6) + variable.APW
    let CP = (variable.CP + parseFloat(level.CPL))

    const ReturnParameters: CalReturn = {
        ...variable, AM, DM, ATT,
        APH, APW, CP,
        HPMax, HP_p, HPR, MPMax, MP_p, MPR, HPT, MPT,
        WEI, WE1, IMM, ACC, EVA, ATS, MOS, SMS
    }

    for (let key in ReturnParameters) {
        if (isNaN(ReturnParameters[key as keyof CalReturn])) {
            console.log(key, ReturnParameters[key as keyof CalReturn])


            // ReturnParameters[key as keyof CalReturn] = 0
        }
    }

    return ReturnParameters
}