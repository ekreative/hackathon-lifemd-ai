import dotenv from "dotenv";

dotenv.config();

export const MAX_MESSAGE_LENGTH = Number(process.env.MAX_MESSAGE_LENGTH ?? 4000);
export const PORT = Number(process.env.PORT) || 8080;
