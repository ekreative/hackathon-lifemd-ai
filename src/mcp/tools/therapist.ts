import { z } from "zod/v3";
import { createAdviceTool } from "./createAdviceTool.js";
import type { ToolRegistration } from "./types.js";

const therapistTool: ToolRegistration = {
    name: "therapist_advice",
    schema: {
        title: "Therapist Advice",
        description: "Дає пораду з фізичних симптомів (біль, температура, кашель, тиск тощо).",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    },
    handler: createAdviceTool(`
Ти — лікар-терапевт LifeMD.
Відповідай:
- простою мовою,
- без постановки діагнозів,
- не прописуй ліки,
- завжди підкреслюй, коли варто звернутись до лікаря особисто.
`),
};

export default therapistTool;
