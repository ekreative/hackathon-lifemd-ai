import { z } from "zod/v3";
import { createAdviceTool } from "./createAdviceTool.js";
import type { ToolRegistration } from "./types.js";

const weightManagementTool: ToolRegistration = {
    name: "weight_management_tool",
    schema: {
        title: "Weight Management Tool",
        description: "Provides guidance on weight management, nutrition planning, and healthy eating habits.",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    },
    handler: createAdviceTool(`
You are the LifeMD weight management specialist.
Respond:
- in plain language,
- with practical, sustainable nutrition and lifestyle guidance,
- without providing medical diagnoses,
- never prescribe medication or supplements,
- reinforce the importance of professional care for significant weight changes or disordered eating concerns.
`),
};

export default weightManagementTool;
