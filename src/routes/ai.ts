import { Router, Request, Response } from "express";
import runLifeMdAgent from "../agent/index.js";
import { BadRequestError } from "../errors.js";
import { respondWithError } from "../utils/http.js";
import { validateMessage } from "../utils/validation.js";

interface AIRequestBody {
    message?: string;
    sessionId?: string; // Додаємо sessionId для ідентифікації сесії
}

const aiRouter = Router();

// Зберігаємо історію повідомлень для кожної сесії (тільки в оперативній пам'яті)
// Ключ: sessionId, Значення: масив повідомлень
const sessionHistory = new Map<string, string[]>();

aiRouter.post(
    "/",
    async (req: Request<unknown, unknown, AIRequestBody>, res: Response) => {
        try {
            const { message, sessionId } = req.body ?? {};
            const normalized = validateMessage(message, "message");
            const sid = sessionId || "default";
            const history = sessionHistory.get(sid) || [];
            history.push(normalized);
            if (history.length > 20) history.splice(0, history.length - 20);
            sessionHistory.set(sid, history);
            // Передаємо всю історію у агент
            const answer = await runLifeMdAgent(history);
            res.json({ answer });
        } catch (err) {
            console.error("AI error:", err);
            const status = err instanceof BadRequestError ? 400 : 500;
            respondWithError(res, status, err instanceof Error ? err.message : "AI error");
        }
    }
);

export default aiRouter;
