import type { CallToolResult } from "@modelcontextprotocol/sdk/spec.types.js";
import { openai } from "../openai.js";

export interface AdviceToolInput {
    question: string;
}

export type AdviceToolHandler = (input: AdviceToolInput) => Promise<CallToolResult>;

export const createAdviceTool = (systemPrompt: string): AdviceToolHandler =>
    async ({ question }: AdviceToolInput) => {
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

        const answer = completion.choices[0]?.message?.content ?? "Failed to generate a response.";

        return {
            content: [{ type: "text", text: answer }],
            structuredContent: { answer },
        };
    };
