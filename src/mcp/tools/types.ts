import type { AdviceToolHandler } from "./createAdviceTool.js";

export interface ToolRegistration {
    name: string;
    schema: Record<string, unknown>;
    handler: AdviceToolHandler;
}
