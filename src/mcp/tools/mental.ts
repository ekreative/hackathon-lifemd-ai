import { z } from "zod/v3";
import { createAdviceTool } from "./createAdviceTool.js";
import type { ToolRegistration } from "./types.js";

const mentalTool: ToolRegistration = {
    name: "mental_support",
    schema: {
        title: "Mental Health Support",
        description: "Advice on sleep, anxiety, stress, and emotional wellbeing.",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    },
    handler: createAdviceTool(`
You are the LifeMD mental coach.
Speak very empathetically and supportively, offering gentle self-help techniques.
Do not provide psychiatric diagnoses.
`),
};

export default mentalTool;
