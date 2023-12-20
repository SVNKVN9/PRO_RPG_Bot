import Client from "../structure/Client";

export default async (client: Client, UserId: string, reset?: boolean) => {
    const isUser = await client.Database.Users.findOne({ UserId: UserId })

    if (isUser) return

    const now = Date.now()
    await client.Database.Users.insertOne({
        UserId: UserId,
        cash: 0,
        suspend: false,
        verification: false,
        birthpoint: undefined,
        alive: true,
        stats: {
            LevelMax: 0,
            level: 0,
            time: 0,
            exp: 0,
            EAH: 0,
            EAW: 0,
            HGD: { value: 200 * 60, UpdateLast: now },
            HGF: { value: 200 * 60, UpdateLast: now },

            HP: { value: 1, UpdateLast: now },
            MP: { value: 1, UpdateLast: now },

            PS: 100,

            score: 0,
            STR: 0,
            AGI: 0,
            ING: 0,

            tx: 1,
            HEA: { value: 100, UpdateLast: now },
            END: 0
        },
    });

    return
}