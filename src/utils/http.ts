import { Response } from "express";

export const respondWithError = (
    res: Response,
    status: number,
    message: string,
    metadata?: Record<string, unknown>
) => res.status(status).json({ error: message, ...metadata });
