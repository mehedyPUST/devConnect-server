import express from "express";
import {
    createPost,
    getPosts,
    getFeed,
    getPostById,
    deletePost,
    likePost,
    addPostComment,
    getUserPosts,
} from "../controllers/postController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.route("/")
    .get(getPosts)
    .post(protect, createPost);

router.get("/feed", protect, getFeed);
router.get("/user/:userId", getUserPosts);

router.route("/:id")
    .get(getPostById)
    .delete(protect, deletePost);

router.put("/:id/like", protect, likePost);
router.post("/:id/comment", protect, addPostComment);

export default router;