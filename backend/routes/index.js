import { Router } from "express";
import {
    signupHandler,
    verifyOtpHandler,
    signinHandler,
    refreshHandler,
    logoutHandler,
    alllogoutHandler,
    getUserInfo,
    forgotPasswordHandler,
    resetPasswordHandler
} from "../controllers/authController.js";
import { todoHandler, viewtodo, delTasks, modifyTodo } from "../controllers/todoController.js";
import { agentManager } from "../controllers/agentController.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signupHandler);
router.post("/verify-otp", verifyOtpHandler);
router.post("/signin", signinHandler);
router.post("/refresh",refreshHandler);
router.get("/user", auth, getUserInfo);
router.post("/todo", auth, todoHandler);
router.get("/todo", auth, viewtodo);
router.delete("/todo", auth, delTasks);
router.put("/todo", auth, modifyTodo);
router.post("/agent", auth, agentManager);
router.post("/logout",auth,logoutHandler);
router.post("/logoutfromAlldevices",auth,alllogoutHandler);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

export default router;
