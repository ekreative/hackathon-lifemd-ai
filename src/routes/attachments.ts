import { Router } from "express";
import multer from "multer";
import runLifeMdAgent from "../agent/index.js";
import { BadRequestError } from "../errors.js";
import { respondWithError } from "../utils/http.js";
import { getConversationId } from "../utils/session.js";

const upload = multer({ storage: multer.memoryStorage() });
const attachmentsRouter = Router();

attachmentsRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return respondWithError(res, 400, "file is required");
    }

    // Determine if it's an image or PDF
    const isImage = file.mimetype?.startsWith("image/");
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname?.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      return respondWithError(
        res,
        400,
        "Unsupported file type. Please upload an image (PNG, JPG) or PDF."
      );
    }

    // Get optional message from request body
    const userMessage = req.body?.message || "Please analyze this document.";
    const sessionId = req.body.sessionId;
    const conversationId = getConversationId(sessionId);

    // Let the agent directly read and analyze the file using vision
    const answer = await runLifeMdAgent(userMessage, conversationId, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
    });

    res.json({
      answer,
    });
  } catch (err) {
    console.error("Attachments API error:", err);
    const status = err instanceof BadRequestError ? 400 : 500;
    respondWithError(
      res,
      status,
      err instanceof Error ? err.message : "Lab result processing failed"
    );
  }
});

export default attachmentsRouter;
