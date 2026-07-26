import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Public
export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select("-password")
            .populate("followers", "name username avatar")
            .populate("following", "name username avatar");

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        user.name = req.body.name || user.name;
        user.bio = req.body.bio || user.bio;
        user.skills = req.body.skills || user.skills;
        user.location = req.body.location || user.location;
        user.github = req.body.github || user.github;
        user.linkedin = req.body.linkedin || user.linkedin;
        user.website = req.body.website || user.website;
        user.avatar = req.body.avatar || user.avatar;

        if (req.body.username && req.body.username !== user.username) {
            const usernameExists = await User.findOne({ username: req.body.username });
            if (usernameExists) {
                res.status(400);
                throw new Error("Username already taken");
            }
            user.username = req.body.username;
        }

        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Follow a user
// @route   PUT /api/users/:id/follow
// @access  Private
export const followUser = async (req, res, next) => {
    try {
        if (req.user._id.toString() === req.params.id) {
            res.status(400);
            throw new Error("You cannot follow yourself");
        }

        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToFollow) {
            res.status(404);
            throw new Error("User not found");
        }

        if (currentUser.following.includes(userToFollow._id)) {
            res.status(400);
            throw new Error("You already follow this user");
        }

        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(currentUser._id);

        await currentUser.save();
        await userToFollow.save();

        // Send notification
        await createNotification({
            recipient: userToFollow._id,
            sender: currentUser._id,
            type: "follow",
            text: `${currentUser.name} started following you`,
            link: `/profile/${currentUser.username}`,
        });

        // Send real-time notification via socket
        const io = req.app.get("io");
        if (io) {
            io.to(userToFollow._id.toString()).emit("newNotification", {
                type: "follow",
                from: {
                    _id: currentUser._id,
                    name: currentUser.name,
                    avatar: currentUser.avatar,
                },
                text: `${currentUser.name} started following you`,
                link: `/profile/${currentUser.username}`,
                createdAt: new Date(),
            });
        }

        res.status(200).json({
            success: true,
            message: `You are now following ${userToFollow.username}`,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Unfollow a user
// @route   PUT /api/users/:id/unfollow
// @access  Private
export const unfollowUser = async (req, res, next) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToUnfollow) {
            res.status(404);
            throw new Error("User not found");
        }

        if (!currentUser.following.includes(userToUnfollow._id)) {
            res.status(400);
            throw new Error("You do not follow this user");
        }

        currentUser.following = currentUser.following.filter(
            (id) => id.toString() !== userToUnfollow._id.toString()
        );

        userToUnfollow.followers = userToUnfollow.followers.filter(
            (id) => id.toString() !== currentUser._id.toString()
        );

        await currentUser.save();
        await userToUnfollow.save();

        res.status(200).json({
            success: true,
            message: `You unfollowed ${userToUnfollow.username}`,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Ban / Unban user (Admin only)
// @route   PUT /api/users/:id/ban
// @access  Private/Admin
export const toggleBanUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        if (user.role === "admin") {
            res.status(400);
            throw new Error("Cannot ban an admin");
        }

        user.isBanned = !user.isBanned;
        await user.save();

        res.status(200).json({
            success: true,
            message: user.isBanned ? "User banned successfully" : "User unbanned successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
};