import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./backend/routes/index.js";
import { PORT, getAllowedOrigins } from "./backend/config/env.js";

mongoose.connect(process.env.MONGODB_URI);

const app = express();
const allowedOrigins = getAllowedOrigins();

app.set("trust proxy", 1);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use(routes);

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})
