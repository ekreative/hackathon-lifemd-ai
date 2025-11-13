import { Router } from "express";
import multer from "multer";
import { toFile } from "openai/uploads";
import runLifeMdAgent from "../agent/index.js";
import { openai } from "../mcp/openai.js";
import { BadRequestError } from "../errors.js";
import { respondWithError } from "../utils/http.js";
import { validateMessage } from "../utils/validation.js";

const upload = multer({ storage: multer.memoryStorage() });
const voiceRouter = Router();

voiceRouter.post("/", upload.single("audio"), async (req, res) => {
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

export default voiceRouter;
