import express from "express";
import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    likeProject,
    addComment,
    getUserProjects,
} from "../controllers/projectController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.route("/").get(getProjects).post(protect, createProject);

router.get("/user/:userId", getUserProjects);

router
    .route("/:id")
    .get(getProjectById)
    .put(protect, updateProject)
    .delete(protect, deleteProject);

router.put("/:id/like", protect, likeProject);
router.post("/:id/comment", protect, addComment);

export default router;