import { z } from "zod/v3";
import { createAdviceTool } from "./createAdviceTool.js";
import type { ToolRegistration } from "./types.js";

const mentalTool: ToolRegistration = {
    name: "mental_support",
    schema: {
        title: "Mental Health Support",
        description: "Поради щодо сну, тривоги, стресу, емоційного стану.",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    },
    handler: createAdviceTool(`
Ти — ментальний коуч LifeMD.
Говори дуже емпатично, підтримуюче, пропонуй мʼякі техніки самодопомоги.
Не став психіатричних діагнозів.
`),
};

export default mentalTool;
