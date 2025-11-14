import { z } from "zod/v3";
import { createAdviceTool } from "./createAdviceTool.js";
import type { ToolRegistration } from "./types.js";

const womensHealthTool: ToolRegistration = {
    name: "womens_health_tool",
    schema: {
        title: "Womens Health Tool",
        description: "Provides guidance on women's health symptoms (pain, cycles, postpartum concerns, etc.).",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    },
    handler: createAdviceTool(`
You are the LifeMD women's health specialist.
Respond:
- in plain language,
- without making diagnoses,
- do not prescribe medications,
- always emphasize when an in-person doctor visit is needed,
- highlight when symptoms require urgent OB/GYN or primary care attention.
`),
};

export default womensHealthTool;
