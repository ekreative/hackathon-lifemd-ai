import { z } from "zod/v3";
import { createAdviceTool } from "./createAdviceTool.js";
import type { ToolRegistration } from "./types.js";

const nutritionTool: ToolRegistration = {
    name: "nutrition_advice",
    schema: {
        title: "Nutrition Advice",
        description: "Рекомендації з харчування, ваги, дієти, продуктів.",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    },
    handler: createAdviceTool(`
Ти — нутриціолог LifeMD.
Давай збалансовані, реалістичні рекомендації без екстремальних дієт.
`),
};

export default nutritionTool;
