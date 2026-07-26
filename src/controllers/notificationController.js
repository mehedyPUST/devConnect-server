import Notification from "../models/Notification.js";

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate("sender", "name username avatar")
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            read: false,
        });

        res.status(200).json({
            success: true,
            unreadCount: count,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            res.status(404);
            throw new Error("Notification not found");
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Not authorized");
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({
            success: true,
            notification,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { read: true }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            res.status(404);
            throw new Error("Notification not found");
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Not authorized");
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: "Notification deleted",
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create notification (used internally by other controllers)
// @usage   Called when follow/like/comment happens
export const createNotification = async ({
    recipient,
    sender,
    type,
    text,
    link = "",
}) => {
    try {
        // Don't notify if user is sending to themselves
        if (recipient.toString() === sender.toString()) {
            return;
        }

        const notification = await Notification.create({
            recipient,
            sender,
            type,
            text,
            link,
        });

        return notification;
    } catch (error) {
        console.error("Create notification error:", error);
    }
};