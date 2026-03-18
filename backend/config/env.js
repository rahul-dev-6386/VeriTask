import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const PORT = Number(process.env.PORT) || 3000;
const isProduction =
    process.env.production === "true" || process.env.NODE_ENV === "production";

function getAllowedOrigins() {
    const configuredOrigins = [
        process.env.FRONTEND_URL,
        process.env.FRONTEND_URLS
    ]
        .filter(Boolean)
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean);

    return [...new Set([
        "http://localhost:5173",
        "https://veri-task.vercel.app",
        ...configuredOrigins
    ])];
}

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export {
    JWT_SECRET,
    REFRESH_SECRET,
    PORT,
    cookieOptions,
    genAI,
    getAllowedOrigins,
    isProduction
};
