import { OpenAIConversationsSession } from "@openai/agents";

const sessions = new Map<string, OpenAIConversationsSession>();

export function getSession(conversationId: string) {
    let session = sessions.get(conversationId);
    if (!session) {
        session = new OpenAIConversationsSession();
        sessions.set(conversationId, session);
    }
    return session;
}

