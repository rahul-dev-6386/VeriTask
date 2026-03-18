import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

function auth(req, res,next) {
    const token = req.cookies.token;

    if (!token) {  // Check if token exists first
        return res.status(401).json({
            message: "No token provided"  // Fixed typo
        });
    }

    try {  //Wrap in try-catch for better error handling
        const decodedData = jwt.verify(token, JWT_SECRET);
        req.userId = decodedData.id;
        next();
    } catch (err) {
        // 2. Token is expired?
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Expired token",
                code: "TOKEN_EXPIRED" // Send a code the frontend can easily read
            });
        }
        
        // 3. Token is fake/tampered with?
        res.status(403).json({
            message: "Invalid token"
        });
    }
    
}

export { auth };
