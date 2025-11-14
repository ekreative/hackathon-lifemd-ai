import mentalTool from "./mental.js";
import nutritionTool from "./nutrition.js";
import therapistTool from "./therapist.js";
import labResultTool from "./labResult.js";
import type { ToolRegistration } from "./types.js";

export const registeredTools: ToolRegistration[] = [
  therapistTool,
  nutritionTool,
  mentalTool,
  labResultTool,
];

export type { ToolRegistration } from "./types.js";
export { createAdviceTool } from "./createAdviceTool.js";
