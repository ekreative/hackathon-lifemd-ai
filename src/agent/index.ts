import { run } from "@openai/agents";
import { lifeMDAgent } from "./lifeMDAgent.js";
import { ensureMcpConnection } from "./mcpServer.js";
import { getSession } from "./lifemdSessionManager.js";

// Helper so the backend can trigger the agent directly with session support
const runLifeMdAgent = async (message: string, conversationId?: string): Promise<string> => {
    await ensureMcpConnection();
    let result;
    if (conversationId) {
        const session = getSession(conversationId);
        result = await run(lifeMDAgent, message, { session });
    } else {
        result = await run(lifeMDAgent, message);
    }
    const finalOutput = result.finalOutput;
    if (typeof finalOutput === "string") {
        return finalOutput;
    }
    throw new Error("Agent did not produce a textual response");
};

export default runLifeMdAgent;
