import axios from "axios";
import { IGuild } from "../types";

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export const APIRoutes = {
    FetchItems: (ItemId?: string) => `/items/${ItemId ?? ''}`,
    FetchGroups: (GroupId?: string) => `/groups/${GroupId ?? ''}`,
    FetchGuilds: (GuildId?: string | null) => `/guilds/${GuildId ?? ''}`,
    CreateGuild: () => `/guilds`
}

export default class {
    private URL: string

    constructor() {
        this.URL = 'http://localhost:8000/api'
    }

    public async request(method: Method, Path: string, data?: any) {
        const result = await axios({
            headers: {
                authorization: 'bot'
            },
            method,
            url: `${this.URL}${Path}`,
            data,
        })

        if (result.status != 200) return

        return result.data
    }
}