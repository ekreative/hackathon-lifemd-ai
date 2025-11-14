import { Router, Request, Response } from "express";
import runLifeMdAgent from "../agent/index.js";
import { getConversationId } from "../utils/session.js";
import { BadRequestError } from "../errors.js";
import { respondWithError } from "../utils/http.js";
import { validateMessage } from "../utils/validation.js";

interface AIRequestBody {
    message?: string;
    sessionId?: string; // Add sessionId for session identification
}

const aiRouter = Router();

aiRouter.post(
    "/",
    async (req: Request<unknown, unknown, AIRequestBody>, res: Response) => {
        try {
            const { message, sessionId } = req.body ?? {};
            const normalized = validateMessage(message, "message");
            const conversationId = getConversationId(sessionId);
            const answer = await runLifeMdAgent(normalized, conversationId);
            res.json({ answer });
        } catch (err) {
            console.error("AI error:", err);
            const status = err instanceof BadRequestError ? 400 : 500;
            respondWithError(res, status, err instanceof Error ? err.message : "AI error");
        }
    }
);

export default aiRouter;
