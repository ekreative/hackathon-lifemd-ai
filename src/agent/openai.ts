import "dotenv/config";
import { setDefaultOpenAIKey } from "@openai/agents";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
}

setDefaultOpenAIKey(apiKey);

export const openAiKey = apiKey;
