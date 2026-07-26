import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// @desc    Start new conversation or get existing one
// @route   POST /api/messages/conversation
// @access  Private
export const createOrGetConversation = async (req, res, next) => {
    try {
        const { receiverId } = req.body;

        if (!receiverId) {
            res.status(400);
            throw new Error("Receiver ID is required");
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            res.status(404);
            throw new Error("Receiver not found");
        }

        let conversation = await Conversation.findOne({
            participants: {
                $all: [req.user._id, receiverId],
                $size: 2,
            },
        }).populate("participants", "name username avatar");

        if (conversation) {
            return res.status(200).json({
                success: true,
                conversation,
            });
        }

        conversation = await Conversation.create({
            participants: [req.user._id, receiverId],
        });

        conversation = await conversation.populate("participants", "name username avatar");

        res.status(201).json({
            success: true,
            conversation,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all conversations of current user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id,
        })
            .populate("participants", "name username avatar")
            .sort({ updatedAt: -1 });

        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversation: conv._id,
                    receiver: req.user._id,
                    read: false,
                });

                return {
                    ...conv.toObject(),
                    unreadCount,
                };
            })
        );

        res.status(200).json({
            success: true,
            count: conversationsWithUnread.length,
            conversations: conversationsWithUnread,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
    try {
        const { conversationId, receiverId, text } = req.body;

        if (!text || !receiverId) {
            res.status(400);
            throw new Error("Receiver ID and text are required");
        }

        let conversation;

        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else {
            conversation = await Conversation.findOne({
                participants: { $all: [req.user._id, receiverId], $size: 2 },
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [req.user._id, receiverId],
                });
            }
        }

        const message = await Message.create({
            conversation: conversation._id,
            sender: req.user._id,
            receiver: receiverId,
            text,
        });

        conversation.lastMessage = {
            text,
            sender: req.user._id,
            createdAt: new Date(),
        };
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "name username avatar")
            .populate("receiver", "name username avatar");

        // Send real-time via Socket.io
        const io = req.app.get("io");
        if (io) {
            io.to(receiverId.toString()).emit("newMessage", populatedMessage);
            io.to(receiverId.toString()).emit("newNotification", {
                type: "message",
                from: {
                    _id: req.user._id,
                    name: req.user.name,
                    avatar: req.user.avatar,
                },
                text: `New message from ${req.user.name}`,
                link: "/messages",
                createdAt: new Date(),
            });
        }

        res.status(201).json({
            success: true,
            message: populatedMessage,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get messages of a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res, next) => {
    try {
        const messages = await Message.find({
            conversation: req.params.conversationId,
        })
            .populate("sender", "name username avatar")
            .populate("receiver", "name username avatar")
            .sort({ createdAt: 1 });

        await Message.updateMany(
            {
                conversation: req.params.conversationId,
                receiver: req.user._id,
                read: false,
            },
            { read: true }
        );

        res.status(200).json({
            success: true,
            count: messages.length,
            messages,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res, next) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            res.status(404);
            throw new Error("Message not found");
        }

        if (message.sender.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Not authorized");
        }

        await message.deleteOne();

        res.status(200).json({
            success: true,
            message: "Message deleted",
        });
    } catch (error) {
        next(error);
    }
};