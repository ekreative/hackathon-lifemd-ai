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

        // Convert the agent's response into an mp3 so the frontend can play it back.
        const speechResponse = await openai.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "alloy",
            input: answer,
            response_format: "mp3",
        });

        const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
        const audioBase64 = audioBuffer.toString("base64");
        const audioMimeType = "audio/mpeg";

        res.json({
            transcript,
            answer,
            audio: {
                base64: audioBase64,
                mimeType: audioMimeType,
            },
        });
    } catch (err) {
        console.error("Voice API error:", err);
        const status = err instanceof BadRequestError ? 400 : 500;
        respondWithError(res, status, err instanceof Error ? err.message : "Voice processing failed");
    }
});

export default voiceRouter;
