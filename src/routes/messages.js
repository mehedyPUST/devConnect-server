import express from "express";
import {
    createOrGetConversation,
    getConversations,
    sendMessage,
    getMessages,
    deleteMessage,
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // All message routes are private

router.post("/conversation", createOrGetConversation);
router.get("/conversations", getConversations);
router.route("/")
    .post(sendMessage);
router.get("/:conversationId", getMessages);
router.delete("/:id", deleteMessage);

export default router;