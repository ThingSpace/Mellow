import axios from 'axios'

export class GithubClient {
    static instance = null

    constructor(token) {
        if (!GithubClient.instance) {
            GithubClient.instance = axios.create({
                baseURL: 'https://api.github.com',
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            })
        }
    }

    static init(token) {
        if (!GithubClient.instance) {
            GithubClient.instance = new GithubClient(token)
        }
    }
}
