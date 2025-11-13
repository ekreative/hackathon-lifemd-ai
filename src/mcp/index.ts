import "dotenv/config";
import { OpenAI } from "openai";
import { z } from "zod/v3";
import type { CallToolResult } from "@modelcontextprotocol/sdk/spec.types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Shape returned to MCP tools
interface AdviceToolInput {
    question: string;
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
}

export const openai = new OpenAI({ apiKey });

const createAdviceTool = (systemPrompt: string) =>
    async ({ question }: AdviceToolInput): Promise<CallToolResult> => {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: systemPrompt.trim(),
                },
                { role: "user", content: question },
            ],
        });

        const answer = completion.choices[0]?.message?.content ?? "Не вдалося сформувати відповідь.";

        return {
            content: [{ type: "text", text: answer }],
            structuredContent: { answer },
        };
    };

// 1) Створюємо MCP сервер
const server = new McpServer({
    name: "lifemd-mcp",
    version: "1.0.0",
});

// 2) Реєструємо tool терапевта
server.registerTool(
    "therapist_advice",
    {
        title: "Therapist Advice",
        description: "Дає пораду з фізичних симптомів (біль, температура, кашель, тиск тощо).",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    } as any,
    createAdviceTool(`
Ти — лікар-терапевт LifeMD.
Відповідай:
- простою мовою,
- без постановки діагнозів,
- не прописуй ліки,
- завжди підкреслюй, коли варто звернутись до лікаря особисто.
`) as any
);

// 3) Нутриціолог
server.registerTool(
    "nutrition_advice",
    {
        title: "Nutrition Advice",
        description: "Рекомендації з харчування, ваги, дієти, продуктів.",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    } as any,
    createAdviceTool(`
Ти — нутриціолог LifeMD.
Давай збалансовані, реалістичні рекомендації без екстремальних дієт.
`) as any
);

// 4) Ментальний коуч
server.registerTool(
    "mental_support",
    {
        title: "Mental Health Support",
        description: "Поради щодо сну, тривоги, стресу, емоційного стану.",
        inputSchema: {
            question: z.string(),
        },
        outputSchema: {
            answer: z.string(),
        },
    } as any,
    createAdviceTool(`
Ти — ментальний коуч LifeMD.
Говори дуже емпатично, підтримуюче, пропонуй мʼякі техніки самодопомоги.
Не став психіатричних діагнозів.
`) as any
);

const transport = new StdioServerTransport();
await server.connect(transport);
