// CopingTool: Builds a rich AI prompt for coping support
export async function buildCopingPrompt({ tool, feeling, userId, db }) {
    let prompt = 'A Discord user is seeking mental health support.'
    if (tool) {
        prompt += `\n- Selected tool: ${tool}`
    }
    if (feeling) {
        prompt += `\n- Described feeling: ${feeling}`
    }

    // Optionally include recent mood history for more context
    let moodHistory = []
    if (userId && db && db.moodCheckIns) {
        const recent = await db.moodCheckIns.getAllForUser(userId, 3)
        if (recent && recent.length) {
            moodHistory = recent.map(c => `${c.mood}${c.note ? ` (${c.note})` : ''}`)
        }
    }
    if (moodHistory.length) {
        prompt += `\n- Recent moods: ${moodHistory.join(', ')}`
    }

    prompt +=
        '\nRespond with a gentle, step-by-step coping exercise or supportive message, tailored to their needs. Use a warm, empathetic tone. If no tool is selected, suggest one based on their feeling.'
    return prompt
}
