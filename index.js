import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./backend/routes/index.js";
import { PORT } from "./backend/config/env.js";

mongoose.connect(process.env.MONGODB_URI);

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use(routes);

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})
