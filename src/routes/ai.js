import express from "express";
import { generateDescription, reviewProject } from "../controllers/aiController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/generate-description", protect, generateDescription);
router.post("/review-project", protect, reviewProject);

export default router;