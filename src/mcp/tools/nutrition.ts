import { z } from "zod/v3";
import { createAdviceTool } from "./createAdviceTool.js";
import type { ToolRegistration } from "./types.js";

const nutritionTool: ToolRegistration = {
    name: "nutrition_advice",
    schema: {
        title: "Nutrition Advice",
        description: "Recommendations on nutrition, weight, diet, and specific foods.",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    },
    handler: createAdviceTool(`
You are the LifeMD nutritionist.
Provide balanced, realistic recommendations without extreme diets.
`),
};

export default nutritionTool;
