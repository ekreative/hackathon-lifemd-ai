import express from "express";
import cors from "cors";
import { PORT } from "./config.js";
import aiRouter from "./routes/ai.js";
import voiceRouter from "./routes/voice.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/ai", aiRouter);
app.use("/api/voice", voiceRouter);

app.listen(PORT, () => {
    console.log(`Proxy backend running on http://localhost:${PORT}`);
});
