import express from "express";
import { uploadImage, deleteImage } from "../controllers/uploadController.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, upload.single("image"), uploadImage);
router.delete("/", protect, deleteImage);

export default router;