import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registeredTools } from "./tools/index.js";

// 1) Create the MCP server
const server = new McpServer({
    name: "lifemd-mcp",
    version: "1.0.0",
});

registeredTools.forEach(({ name, schema, handler }) => {
    server.registerTool(name, schema as any, handler as any);
});

const transport = new StdioServerTransport();
await server.connect(transport);
