import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["follow", "like_project", "like_post", "comment_project", "comment_post", "message", "collaboration"],
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        link: {
            type: String, // e.g., /project/123, /profile/username, /messages
            default: "",
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;