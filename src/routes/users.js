import express from "express";
import {
    getUserProfile,
    updateProfile,
    followUser,
    unfollowUser,
    getAllUsers,
    toggleBanUser,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/:username", getUserProfile);

// Private
router.put("/profile", protect, updateProfile);
router.put("/:id/follow", protect, followUser);
router.put("/:id/unfollow", protect, unfollowUser);

// Admin only
router.get("/", protect, authorize("admin"), getAllUsers);
router.put("/:id/ban", protect, authorize("admin"), toggleBanUser);

export default router;