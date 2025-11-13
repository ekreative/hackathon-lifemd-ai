import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import runLifeMdAgent from "./agent/index.js";
import { openai } from "./mcp/index.js";
import { toFile } from "openai/uploads";

interface AIRequestBody {
    message?: string;
}

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/ai", async (
    req: Request<unknown, unknown, AIRequestBody>,
    res: Response
) => {
    try {
        const { message } = req.body ?? {};
        if (typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({ error: "message is required" });
        }

        const answer = await runLifeMdAgent(message);

        res.json({ answer });
    } catch (err) {
        console.error("AI error:", err);
        res.status(500).json({ error: "AI error" });
    }
});

// 🔹 Новий голосовий ендпоінт
app.post("/api/voice", upload.single("audio"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "audio file is required" });
        }

        // 1) Отримаємо транскрипцію від OpenAI
        // Модель може бути типу "gpt-4o-mini-transcribe" або "whisper-1" – залежно від того, що у вас дозволено.
        const audioFile = await toFile(file.buffer, file.originalname || "audio.webm");

        const transcription = await openai.audio.transcriptions.create({
            // якщо у вас ще whisper:
            model: "gpt-4o-mini-transcribe",
            file: audioFile,
            // optional:
            // language: "uk", // якщо хочеш явно вказати
        });

        const text = transcription.text;
        console.log("Transcribed text:", text);

        // 2) Кидаємо текст в твій LifeMD агент
        const answer = await runLifeMdAgent(text);

        // 3) Повертаємо і транскрипт, і відповідь агента
        res.json({
            transcript: text,
            answer,
        });
    } catch (err) {
        console.error("Voice API error:", err);
        res.status(500).json({ error: "Voice processing failed" });
    }
});


const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
    console.log(`Proxy backend running on http://localhost:${PORT}`);
});
