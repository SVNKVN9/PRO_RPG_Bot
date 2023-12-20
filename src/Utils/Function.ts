import moment from "moment-timezone"

export const NumberWithCommas = (x: number) => x ? parseInt(x.toString()).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 0
export const FloatWithCommas = (x: number) => x ? parseFloat(x.toString()).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 0
export const Delay = (ms: number) => new Promise(res => setTimeout(res, ms))

export const minToTime = (minutes: number) => `${parseInt((minutes / 60).toFixed(1))}h ${minutes % 60}m`

export const isDecimal = (num: number) => num % 1 === 0;

export const msToHour = (ms: number) => {
    let second = Math.floor(ms / 1000)
    let minutes = Math.floor(second / 60)
    let hours = Math.floor(minutes / 60)

    return `${hours} Hours`
}

export const msToHM = (ms: number) => {
    let seconds = Math.floor(ms / 1000)
    let minutes = Math.floor(seconds / 60)
    let hours = Math.floor(minutes / 60)

    seconds = seconds % 60
    minutes = minutes % 60

    return `${hours} h, ${minutes} m`
}

export const msToDHM = (ms: number) => {
    let seconds = Math.floor(ms / 1000)
    let minutes = Math.floor(seconds / 60)
    let hours = Math.floor(minutes / 60)
    let days = Math.floor(hours / 24)

    seconds = seconds % 60
    minutes = minutes % 60
    hours = hours % 24

    return `${days}d ${hours}h ${minutes}m`
}

export const msToDHMS = (ms: number) => {
    let seconds = Math.floor(ms / 1000)
    let minutes = Math.floor(seconds / 60)
    let hours = Math.floor(minutes / 60)
    let days = Math.floor(hours / 24)

    seconds = seconds % 60
    minutes = minutes % 60
    hours = hours % 24

    return `${days}d ${hours}h ${minutes}m ${seconds}s`
}

export const msToDHMS_Thai = (ms: number) => {
    let seconds = Math.floor(ms / 1000)
    let minutes = Math.floor(seconds / 60)
    let hours = Math.floor(minutes / 60)
    let days = Math.floor(hours / 24)

    seconds = seconds % 60
    minutes = minutes % 60
    hours = hours % 24

    return `${days}วัน ${hours}ชั่วโมง ${minutes}นาที ${seconds}วินาที`
}

export const msToDHMS_Thai_V2 = (ms: number) => {
    let seconds = Math.floor(ms / 1000)
    let minutes = Math.floor(seconds / 60)
    let hours = Math.floor(minutes / 60)
    let days = Math.floor(hours / 24)

    seconds = seconds % 60
    minutes = minutes % 60
    hours = hours % 24

    let texts = []

    if (days != 0) texts.push(`${days}วัน`)
    if (hours != 0) texts.push(`${hours}ชั่วโมง`)
    if (minutes != 0) texts.push(`${minutes}นาที`)
    if (seconds != 0) texts.push(`${seconds}วินาที`)

    return texts.join(' ')
}

export const CreateId = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export const DHMStoSec = (str: string | undefined) => {
    let sec = 0

    if (!str) return sec

    const [Day, Hour, Min, Sec] = str.split('/')

    sec = sec + (parseInt(Day) * 86_400)
    sec = sec + (parseInt(Hour) * 3_600)
    sec = sec + (parseInt(Min) * 60)
    sec = sec + parseInt(Sec)

    return sec
}

export const ThaiZone = (time: number) => moment(time).tz('Asia/Bangkok').format('DD/MM/YYYY HH:mm')

export const PrograssBar = (value: number) => {
    if (value >= 99) return '🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩'
    else if (value >= 94) return '🟩🟩🟩🟩🟩🟩🟩🟩🟩'
    else if (value >= 89) return '🟩🟩🟩🟩🟩🟩🟩🟩🟩'
    else if (value >= 79) return '🟩🟩🟩🟩🟩🟩🟩🟩'
    else if (value >= 69) return '🟨🟨🟨🟨🟨🟨🟨'
    else if (value >= 59) return '🟨🟨🟨🟨🟨🟨'
    else if (value >= 49) return '🟨🟨🟨🟨🟨'
    else if (value >= 39) return '🟧🟧🟧🟧'
    else if (value >= 29) return '🟧🟧🟧'
    else if (value >= 19) return '🟥🟥'
    else if (value >= 9) return '🟥'
    else if (value >= 6) return ''
    else if (value >= 3) return ''
    else return ''
}