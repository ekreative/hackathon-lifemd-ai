// Only load dotenv in local development
// In production (Render sets RENDER=true), env vars are injected directly by the platform
if (process.env.RENDER !== "true") {
    console.error("[MCP OpenAI] Loading .env for local development");
    await import("dotenv/config");
} else {
    console.error("[MCP OpenAI] Production environment detected, using platform env vars");
}

import { OpenAI } from "openai";

const apiKey = process.env.OPENAI_API_KEY;

console.error(`[MCP OpenAI] Checking for API key... ${apiKey ? 'Found' : 'NOT FOUND'}`);

if (!apiKey) {
    console.error("[MCP OpenAI] OPENAI_API_KEY environment variable is not set!");
    console.error("[MCP OpenAI] Available env vars:", Object.keys(process.env).filter(k => !k.includes('SECRET')).join(", "));
    throw new Error("OPENAI_API_KEY is not set in MCP server process");
}

console.error("[MCP OpenAI] OpenAI client initialized successfully");
export const openai = new OpenAI({ apiKey });
