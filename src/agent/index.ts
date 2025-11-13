import "dotenv/config";
import { Agent, run, MCPServerStdio, setDefaultOpenAIKey } from "@openai/agents";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const openAiKey = process.env.OPENAI_API_KEY;
if (!openAiKey) {
    throw new Error("OPENAI_API_KEY is not set");
}
setDefaultOpenAIKey(openAiKey);

const currentDirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirname, "..", "..");
const distMcpEntryPoint = path.resolve(projectRoot, "dist", "mcp", "index.js");
const srcMcpEntryPoint = path.resolve(projectRoot, "src", "mcp", "index.ts");

const mcpServer = fs.existsSync(distMcpEntryPoint)
    ? new MCPServerStdio({
          command: "node",
          args: [distMcpEntryPoint, "--stdio"],
      })
    : new MCPServerStdio({
          command: "node",
          args: ["--loader", "ts-node/esm", srcMcpEntryPoint, "--stdio"],
      });

let connectPromise: Promise<void> | null = null;
let isConnected = false;
let isClosing = false;

const ensureMcpConnection = async (): Promise<void> => {
    if (isClosing) {
        throw new Error("MCP server is shutting down");
    }

    if (!connectPromise) {
        connectPromise = mcpServer
            .connect()
            .then(() => {
                isConnected = true;
            })
            .catch((err) => {
                connectPromise = null;
                throw err;
            });
    }

    await connectPromise;
};

const closeMcpConnection = async (): Promise<void> => {
    if (!isConnected || isClosing) {
        return;
    }
    isClosing = true;
    try {
        await mcpServer.close();
    } finally {
        isConnected = false;
    }
};

(["SIGINT", "SIGTERM"] as NodeJS.Signals[]).forEach((signal) => {
    process.once(signal, () => {
        closeMcpConnection().catch((err) => {
            console.error("Failed to close MCP server", err);
        });
    });
});

process.once("beforeExit", () => {
    closeMcpConnection().catch((err) => {
        console.error("Failed to close MCP server", err);
    });
});

const lifeMdAgent = new Agent({
    name: "LifeMD Health Assistant",
    model: "gpt-4o-mini",
    instructions: `
Ти — головний AI асистент LifeMD.

Ти підключений до MCP-сервера "lifemd-mcp", який надає тобі 3 інструменти:
- therapist_advice: фізичні симптоми, біль, температура, кашель, тиск тощо;
- nutrition_advice: харчування, вага, дієта, продукти;
- mental_support: сон, тривога, стрес, емоційний стан.

Якщо запит користувача:
- про симптоми тіла → викликай therapist_advice;
- про їжу, вагу, дієту → викликай nutrition_advice;
- про сон, тривогу, настрій, стрес → викликай mental_support;
- не медичний / сервісний → відповідай самостійно як турботливий асистент LifeMD.

Пиши короткими абзацами, простою людською мовою, не став діагнозів і не призначай ліки.
`.trim(),
    mcpServers: [mcpServer],
});

// Хелпер щоб бекенд міг просто викликати агент
const runLifeMdAgent = async (message: string): Promise<string> => {
    await ensureMcpConnection();
    const result = await run(lifeMdAgent, message);
    const finalOutput = result.finalOutput;
    if (typeof finalOutput === "string") {
        return finalOutput;
    }
    throw new Error("Agent did not produce a textual response");
};

export default runLifeMdAgent;
