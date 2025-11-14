import mentalHealthTool from "./mentalHealth.js";
import weightManagementTool from "./weightManagement.js";
import womensHealthTool from "./womensHealth.js";
import doctorsTool from "./doctors.js";

import type { ToolRegistration } from "./types.js";


export const registeredTools: ToolRegistration[] = [womensHealthTool, weightManagementTool, mentalHealthTool, doctorsTool];

export type { ToolRegistration } from "./types.js";
export { createAdviceTool } from "./createAdviceTool.js";
