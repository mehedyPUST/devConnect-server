import express from "express";
import {
    register,
    login,
    logout,
    getMe,
    githubAuth,
    githubCallback,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

// GitHub OAuth
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);

export default router;