import { Router, Request, Response } from "express";
import runLifeMdAgent from "../agent/index.js";
import { BadRequestError } from "../errors.js";
import { respondWithError } from "../utils/http.js";
import { validateMessage } from "../utils/validation.js";

interface AIRequestBody {
    message?: string;
}

const aiRouter = Router();

aiRouter.post(
    "/",
    async (req: Request<unknown, unknown, AIRequestBody>, res: Response) => {
        try {
            const { message } = req.body ?? {};
            const normalized = validateMessage(message, "message");
            const response = await runLifeMdAgent(normalized);
            // Return both message and optional navigate field
            res.json({ 
                answer: response.message,
                ...(response.navigate && { navigate: response.navigate })
            });
        } catch (err) {
            console.error("AI error:", err);
            const status = err instanceof BadRequestError ? 400 : 500;
            respondWithError(res, status, err instanceof Error ? err.message : "AI error");
        }
    }
);

export default aiRouter;
