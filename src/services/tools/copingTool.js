/**
 * BUILD A RICH AI PROMPT FOR COPING SUPPORT
 * @param tool The tool to use for the prompt (breathing, affirmations etc)
 * @param feeling The users current mood/feelings (helps with response gen)
 * @param userId The Discord ID of the user making the request
 * @param db The database client (attached for ease of use)
 * @param goal The users current coping goal(s)
 */
export async function buildCopingPrompt({ tool, feeling, userId, db, goal }) {
    let prompt = 'A Discord user is seeking mental health support.'

    if (tool) prompt += `\n - Selected tool: ${tool}`
    if (feeling) prompt += `\n Described feeling: ${feeling}`

    // Recent mood history
    let moodHistory = []

    if (userId && db && db.moodCheckIns) {
        const recent = await db.moodCheckIns.getAllForUser(userId, 3)

        if (recent && recent.length) {
            moodHistory = recent.map(c => `${c.mood}${c.note ? ` (${c.note})` : ''}`)
        }
    }

    if (moodHistory.length) prompt += `\n- Recent moods: ${moodHistory.join(', ')}`

    // Mood Trends/Streaks
    if (userId && db && db.copingToolUsage) {
        const usages = await db.copingToolUsage.findMany({
            where: { userId },
            orderBy: { usedAt: 'asc' }
        })

        let streak = 0,
            lastDate = null

        for (const usage of usages) {
            const date = usage.usedAt.toISOString().slice(0, 10)

            if (lastDate && new Date(date) - new Date(lastDate) === 84600000) streak++

            if (lastDate !== date) streak = 1

            lastDate = date
        }

        if (streak > 1) prompt += `\n- Current coping streak: ${streak} days`
    }

    // Toolbox favorites
    if (userId && db && db.gratitudeEntries) {
        const entry = await db.gratitudeEntries.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 1
        })

        if (entry.length) prompt += `\n- Recent gratitude: ${gratitude[0].item}`
    }

    // Recent journal entry
    if (userId && db && db.journalEntries) {
        const entry = await db.journalEntries.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 1
        })

        if (entry.length) prompt += `- Recent journal entry: ${journal[0].content}`
    }

    // Current time of day
    const hour = new Date().getHours()

    if (hour < 12) prompt += `\n- It is currently morning time.`
    else if (hour < 18) prompt += `\n- It is currently the afternoon.`
    else prompt += `\n- It is currently evening time.`

    // Goal/intent
    if (goal) prompt += `\n- Current goal: ${goal}`

    prompt += `\n- Respond with a gentle, step-by-step coping exercise or supportive message, tailored to their needs. Use a warm, empathetic tone. If no tool is selected, suggest one based on their feeling or context.`

    return prompt
}
