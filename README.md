# LifeMD AI Proxy

Express proxy that hosts the LifeMD multi-agent workflow. It exposes HTTP endpoints that forward user text or voice prompts to an OpenAI-powered agent that can route health-related questions to Model Context Protocol (MCP) tools for therapist, nutrition, and mental-support advice.

## Features
- `@openai/agents` LifeMD agent wired up with three MCP tools (`therapist_advice`, `nutrition_advice`, `mental_support`).
- REST endpoint (`POST /api/ai`) for direct text prompts.
- Voice endpoint (`POST /api/voice`) that accepts an audio file, transcribes it with OpenAI (`gpt-4o-mini-transcribe`), and funnels the transcript to the agent.
- TypeScript source with build step that emits ESM JavaScript to `dist/`.

## Prerequisites
- Node.js 20+
- npm 10+
- An OpenAI API key with access to GPT-4o Mini (chat + transcription models)

## Environment Variables
Create a `.env` file or export the variables before launching the server.

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | Required. Used by both the HTTP proxy and the MCP tools/agent. |
| `PORT` | Optional. Defaults to `8080`. |

## Install & Run
```bash
npm install           # install dependencies
npm run dev           # start TS server with ts-node (hot reload)
npm run build         # compile TypeScript to dist/
npm start             # run compiled server (build runs automatically first)
```

## API
### POST /api/ai
- Body: `{ "message": "string" }`
- Response: `{ "answer": "string" }`
- Errors: `400` when `message` missing/empty, `500` for unexpected agent issues.

### POST /api/voice
- Content-Type: `multipart/form-data`
- Field: `audio` (single file, e.g. `.webm`, `.wav`)
- Response: `{ "transcript": "text", "answer": "string" }`
- Errors: `400` when file missing, `500` if transcription or agent call fails.

## Development Notes
- Source entry point: `src/index.ts`; build target: `dist/index.js`.
- MCP server entry: `src/mcp/index.ts` (compiled to `dist/mcp/index.js`). The agent dynamically picks the compiled version when present, otherwise falls back to ts-node.
- The `/api/voice` endpoint depends on `multer` for in-memory uploads and `openai/audio.transcriptions.create` with `toFile` helper from the OpenAI SDK.

### Code Structure Cheat Sheet
- `src/index.ts` – bootstraps Express, mounts shared middleware, and wires the modular routers.
- `src/routes/` – houses one router per HTTP surface (`ai.ts` for text prompts, `voice.ts` for uploads). Each router handles its own middleware stack (e.g., Multer for voice) and uses shared helpers.
- `src/utils/` – reusable HTTP helpers (`http.ts`) and validation logic (`validation.ts`) that enforce consistent error messaging and request limits.
- `src/config.ts` / `src/errors.ts` – central place for environment-driven settings and HTTP-friendly error types.
- `src/mcp/` – contains the MCP server exposed to the agent. `openai.ts` wires the shared SDK client, `tools/` holds one file per MCP tool plus a `createAdviceTool` factory, and `index.ts` simply registers everything.
- `src/agent/` – mirrors the same idea for the agent runtime. `openai.ts` validates the API key and sets the default key for `@openai/agents`, `mcpServer.ts` handles child-process lifecycle + shutdown hooks, `lifeMdAgent.ts` defines the agent persona, and `index.ts` exports `runLifeMdAgent` for the HTTP layer.
- When adding a new tool or agent behavior, drop a new file in the respective folder and export it through the local `index.ts` barrel to keep each concern isolated.

## Testing Locally
1. Ensure `OPENAI_API_KEY` is set (`export OPENAI_API_KEY=...`).
2. Run `npm run dev` and open another terminal.
3. Test text flow:
   ```bash
   curl -X POST http://localhost:8080/api/ai \
        -H 'Content-Type: application/json' \
        -d '{"message":"Маю головний біль"}'
   ```
4. Test voice flow (replace `clip.webm` with your file):
   ```bash
   curl -X POST http://localhost:8080/api/voice \
        -F 'audio=@clip.webm'
   ```
