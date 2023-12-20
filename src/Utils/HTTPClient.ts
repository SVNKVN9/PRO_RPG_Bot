import axios from "axios";

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export const APIRoutes = {
    FetchItems: (ItemId?: string) => `/items/${ItemId ?? ''}`,
    FetchGroups: (GroupId?: string) => `/groups/${GroupId ?? ''}`
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