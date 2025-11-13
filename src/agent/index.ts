import { run } from "@openai/agents";
import { lifeMDAgent } from "./lifeMDAgent.js";
import { ensureMcpConnection } from "./mcpServer.js";

// Хелпер щоб бекенд міг просто викликати агент
const runLifeMdAgent = async (message: string): Promise<string> => {
    await ensureMcpConnection();
    const result = await run(lifeMDAgent, message);
    const finalOutput = result.finalOutput;
    if (typeof finalOutput === "string") {
        return finalOutput;
    }
    throw new Error("Agent did not produce a textual response");
};

export default runLifeMdAgent;
