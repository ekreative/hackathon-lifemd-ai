import { z } from "zod/v3";
import { createAdviceTool } from "./createAdviceTool.js";
import type { ToolRegistration } from "./types.js";

const therapistTool: ToolRegistration = {
    name: "therapist_advice",
    schema: {
        title: "Therapist Advice",
        description: "Provides guidance on physical symptoms (pain, fever, cough, blood pressure, etc.).",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    },
    handler: createAdviceTool(`
You are the LifeMD primary care physician.
Respond:
- in plain language,
- without making diagnoses,
- do not prescribe medications,
- always emphasize when an in-person doctor visit is needed.
`),
};

export default therapistTool;
