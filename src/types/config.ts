export interface WebHook {
    ErrorHandling: string
    ExecutedCommand: string
    // LevelSystem: string
    try_catch_Handling: string
    Sharding: string
    Debug: string
}

export interface config {
    TOKEN: string
    MongoURL: string
    DBName: string
    WebHook: WebHook
    CLIENT_ID: string
    PREFIX: string
    OnwerIds: string[]
    SuspendIds: string[]
    Servers: string[]
}

// export interface Config {

// }