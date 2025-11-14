import { z } from "zod/v3";
import { createAdviceTool } from "./createAdviceTool.js";
import type { ToolRegistration } from "./types.js";

const mentalHealthTool: ToolRegistration = {
    name: "mental_health_tool",
    schema: {
        title: "Mental Health Tool",
        description: "Advice on sleep, anxiety, stress, and emotional wellbeing.",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    },
    handler: createAdviceTool(`
You are the LifeMD mental health coach.
Speak very empathetically and supportively, offering gentle self-help techniques.
Do not provide psychiatric diagnoses or medication guidance.
`),
};

export default mentalHealthTool;
