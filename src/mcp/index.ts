import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registeredTools } from "./tools/index.js";

console.error("[MCP Server] Starting initialization...");

try {
    // 1) Create the MCP server
    const server = new McpServer({
        name: "lifemd-mcp",
        version: "1.0.0",
    });

    console.error(`[MCP Server] Registering ${registeredTools.length} tools...`);
    registeredTools.forEach(({ name, schema, handler }) => {
        console.error(`[MCP Server] Registering tool: ${name}`);
        server.registerTool(name, schema as any, handler as any);
    });

    console.error("[MCP Server] Creating stdio transport...");
    const transport = new StdioServerTransport();
    
    console.error("[MCP Server] Connecting server to transport...");
    await server.connect(transport);
    
    console.error("[MCP Server] Successfully connected and ready!");
} catch (error) {
    console.error("[MCP Server] Fatal error during initialization:", error);
    process.exit(1);
}
