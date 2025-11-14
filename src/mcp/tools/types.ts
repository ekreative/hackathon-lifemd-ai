import type { AdviceToolHandler } from "./createAdviceTool.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/spec.types.js";

export type ToolHandler =
  | AdviceToolHandler
  | ((input: any) => Promise<CallToolResult>);

export interface ToolRegistration {
  name: string;
  schema: Record<string, unknown>;
  handler: ToolHandler;
}
