import { BadRequestError } from "../errors.js";
import { MAX_MESSAGE_LENGTH } from "../config.js";

export const validateMessage = (message: unknown, fieldName: string): string => {
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
