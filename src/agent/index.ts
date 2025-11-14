import { run } from "@openai/agents";
import { lifeMDAgent } from "./lifeMDAgent.js";
import { ensureMcpConnection } from "./mcpServer.js";

// Допоміжна функція для запуску агента з історією повідомлень
const runLifeMdAgent = async (history: string[]): Promise<string> => {
    await ensureMcpConnection();
    // Передаємо всю історію як масив у run
    const result = await run(lifeMDAgent, history);
    const finalOutput = result.finalOutput;
    if (typeof finalOutput === "string") {
        return finalOutput;
    }
    throw new Error("Agent did not produce a textual response");
};

export default runLifeMdAgent;
