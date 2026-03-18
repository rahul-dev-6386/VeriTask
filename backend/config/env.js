import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const PORT = 3000;

const cookieOptions = {
    httpOnly: true,
    secure: process.env.production === "true",
    sameSite: "strict"
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export { JWT_SECRET, REFRESH_SECRET, PORT, cookieOptions, genAI };
