import { MCPServerStdio } from "@openai/agents";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentDirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirname, "..", "..");
const distMcpEntryPoint = path.resolve(projectRoot, "dist", "mcp", "index.js");
const srcMcpEntryPoint = path.resolve(projectRoot, "src", "mcp", "index.ts");

// Log which entry point we're using
console.log(`[MCP] Project root: ${projectRoot}`);
console.log(`[MCP] Checking for dist entry point: ${distMcpEntryPoint}`);
console.log(`[MCP] Dist exists: ${fs.existsSync(distMcpEntryPoint)}`);

export const mcpServer = fs.existsSync(distMcpEntryPoint)
    ? new MCPServerStdio({
          command: "node",
          args: [distMcpEntryPoint, "--stdio"],
          env: process.env as Record<string, string>, // Pass environment variables
      })
    : new MCPServerStdio({
          command: "node",
          args: ["--loader", "ts-node/esm", srcMcpEntryPoint, "--stdio"],
          env: process.env as Record<string, string>, // Pass environment variables
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
        console.log("[MCP] Starting MCP server connection...");
        connectPromise = mcpServer
            .connect()
            .then(() => {
                console.log("[MCP] MCP server connected successfully");
                isConnected = true;
            })
            .catch((err) => {
                console.error("[MCP] Failed to connect to MCP server:", err);
                connectPromise = null;
                throw new Error(`Error initializing MCP server: ${err.message}`);
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
