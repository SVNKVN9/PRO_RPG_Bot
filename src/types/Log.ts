export enum LogAction {
    Join = "Join",
    Leave = 'Leave'
}

export interface IUptimeLog {
    Action: LogAction.Join | LogAction.Leave
    UserId: string,
    ChannelId: string,
    GuildId: string,
    Time: number,
    EXP: number
    Timestramp: number
    Expire: number
}