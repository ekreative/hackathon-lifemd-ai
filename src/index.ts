import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import runLifeMdAgent from "./agent/index.js";
import { openai } from "./mcp/openai.js";
import { toFile } from "openai/uploads";

interface AIRequestBody {
    message?: string;
}

class BadRequestError extends Error {}

dotenv.config();

const MAX_MESSAGE_LENGTH = Number(process.env.MAX_MESSAGE_LENGTH ?? 4000);

const validateMessage = (message: unknown, fieldName: string): string => {
    if (typeof message !== "string") {
        throw new BadRequestError(`${fieldName} must be a string`);
    }
    const normalized = message.trim();
    if (!normalized) {
        throw new BadRequestError(`${fieldName} is required`);
    }
    if (normalized.length > MAX_MESSAGE_LENGTH) {
        throw new BadRequestError(`${fieldName} exceeds ${MAX_MESSAGE_LENGTH} characters`);
    }
    return normalized;
};

const respondWithError = (
    res: Response,
    status: number,
    message: string,
    metadata?: Record<string, unknown>
) => res.status(status).json({ error: message, ...metadata });

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const upload = multer({ storage: multer.memoryStorage() });

app.post(
    "/api/ai",
    async (req: Request<unknown, unknown, AIRequestBody>, res: Response) => {
        try {
            const { message } = req.body ?? {};
            const normalized = validateMessage(message, "message");
            const answer = await runLifeMdAgent(normalized);
            res.json({ answer });
        } catch (err) {
            console.error("AI error:", err);
            const status = err instanceof BadRequestError ? 400 : 500;
            respondWithError(res, status, err instanceof Error ? err.message : "AI error");
        }
    }
);

// 🔹 Новий голосовий ендпоінт
app.post("/api/voice", upload.single("audio"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return respondWithError(res, 400, "audio file is required");
        }

        const audioFile = await toFile(file.buffer, file.originalname || "audio.webm");

        const transcription = await openai.audio.transcriptions.create({
            model: "gpt-4o-mini-transcribe",
            file: audioFile,
        });

        const transcript = validateMessage(transcription.text, "transcript");
        console.log("Transcribed text:", transcript);

        const answer = await runLifeMdAgent(transcript);

        res.json({
            transcript,
            answer,
        });
    } catch (err) {
        console.error("Voice API error:", err);
        const status = err instanceof BadRequestError ? 400 : 500;
        respondWithError(res, status, err instanceof Error ? err.message : "Voice processing failed");
    }
});


const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
    console.log(`Proxy backend running on http://localhost:${PORT}`);
});
