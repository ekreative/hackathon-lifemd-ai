import { MCPServerStdio } from "@openai/agents";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentDirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirname, "..", "..");
const distMcpEntryPoint = path.resolve(projectRoot, "dist", "mcp", "index.js");
const srcMcpEntryPoint = path.resolve(projectRoot, "src", "mcp", "index.ts");

export const mcpServer = fs.existsSync(distMcpEntryPoint)
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
let hooksRegistered = false;

export const ensureMcpConnection = async (): Promise<void> => {
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

export const closeMcpConnection = async (): Promise<void> => {
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

const registerShutdownHooks = (): void => {
    if (hooksRegistered) {
        return;
    }
    hooksRegistered = true;

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
};

registerShutdownHooks();
