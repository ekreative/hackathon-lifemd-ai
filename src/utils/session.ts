// Generating a conversationId for a session
export function getConversationId(input?: string): string {
    if (input && input.length > 0) return input;
    return `session-${Date.now()}-${Math.random()}`;
}
