// CopingTool: Builds a rich AI prompt for coping support
export async function buildCopingPrompt({ tool, feeling, userId, db, goal }) {
    let prompt = 'A Discord user is seeking mental health support.'

    if (tool) prompt += `\n- Selected tool: ${tool}`
    if (feeling) prompt += `\n- Described feeling: ${feeling}`

    // Recent mood history
    let moodHistory = []
    if (userId && db && db.moodCheckIns) {
        const recent = await db.moodCheckIns.getAllForUser(userId, 3)
        if (recent && recent.length) {
            moodHistory = recent.map(c => `${c.mood}${c.note ? ` (${c.note})` : ''}`)
        }
    }
    if (moodHistory.length) prompt += `\n- Recent moods: ${moodHistory.join(', ')}`

    // Streaks
    if (userId && db && db.copingToolUsage) {
        const usages = await db.copingToolUsage.findMany({ where: { userId }, orderBy: { usedAt: 'asc' } })
        let streak = 0,
            lastDate = null
        for (const usage of usages) {
            const date = usage.usedAt.toISOString().slice(0, 10)
            if (lastDate && new Date(date) - new Date(lastDate) === 86400000) {
                streak++
            } else if (lastDate !== date) {
                streak = 1
            }
            lastDate = date
        }
        if (streak > 1) prompt += `\n- Current coping streak: ${streak} days`
    }

    // Toolbox favorites
    if (userId && db && db.favoriteCopingTool) {
        const favorites = await db.favoriteCopingTool.findMany({ where: { userId } })
        if (favorites.length) {
            prompt += `\n- Favorite coping tools: ${favorites.map(f => f.tool).join(', ')}`
        }
    }

    // Recent gratitude
    if (userId && db && db.gratitudeEntry) {
        const gratitude = await db.gratitudeEntry.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 1
        })
        if (gratitude.length) {
            prompt += `\n- Recent gratitude: ${gratitude[0].item}`
        }
    }

    // Recent journal
    if (userId && db && db.journalEntry) {
        const journal = await db.journalEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 })
        if (journal.length) {
            prompt += `\n- Recent journal entry: ${journal[0].content}`
        }
    }

    // Time of day
    const hour = new Date().getHours()
    if (hour < 12) prompt += `\n- It is currently morning for the user.`
    else if (hour < 18) prompt += `\n- It is currently afternoon for the user.`
    else prompt += `\n- It is currently evening for the user.`

    // Goal/intent
    if (goal) prompt += `\n- User's goal: ${goal}`

    prompt +=
        '\nRespond with a gentle, step-by-step coping exercise or supportive message, tailored to their needs. Use a warm, empathetic tone. If no tool is selected, suggest one based on their feeling or context.'

    return prompt
}
