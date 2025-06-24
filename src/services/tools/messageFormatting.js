export class MessageFormattingTool {
    formatForDiscord(response) {
        if (response.length <= 1900) {
            return response
        }
        return this.simpleSplit(response)
    }

    simpleSplit(response) {
        const maxLength = 1900
        const parts = []
        let start = 0
        while (start < response.length) {
            parts.push(response.slice(start, start + maxLength))
            start += maxLength
        }
        return parts
    }
}
