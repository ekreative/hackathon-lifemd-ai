import { run } from "@openai/agents";
import { lifeMDAgent } from "./lifeMDAgent.js";
import { ensureMcpConnection } from "./mcpServer.js";

export interface AgentResponse {
    message: string;
    navigate?: string;
}

// Helper so the backend can trigger the agent directly
const runLifeMdAgent = async (message: string): Promise<AgentResponse> => {
    await ensureMcpConnection();
    const result = await run(lifeMDAgent, message);
    const finalOutput = result.finalOutput;
    
    if (typeof finalOutput === "string") {
        // Try to parse as JSON first (for navigation responses)
        try {
            const parsed = JSON.parse(finalOutput);
            if (parsed.message && typeof parsed.message === "string") {
                return {
                    message: parsed.message,
                    navigate: parsed.navigate || undefined,
                };
            }
        } catch {
            // Not JSON, return as plain message
        }
        return { message: finalOutput };
    }
    
    throw new Error("Agent did not produce a textual response");
};

export default runLifeMdAgent;
