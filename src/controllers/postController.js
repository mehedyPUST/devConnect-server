import Post from "../models/Post.js";
import User from "../models/User.js";

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
    try {
        const { content } = req.body;

        if (!content) {
            res.status(400);
            throw new Error("Post content is required");
        }

        const post = await Post.create({
            content,
            author: req.user._id,
        });

        const populatedPost = await Post.findById(post._id).populate(
            "author",
            "name username avatar"
        );

        res.status(201).json({
            success: true,
            post: populatedPost,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all posts (feed)
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res, next) => {
    try {
        const posts = await Post.find()
            .populate("author", "name username avatar")
            .populate("comments.user", "name username avatar")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: posts.length,
            posts,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get feed for logged-in user (following only)
// @route   GET /api/posts/feed
// @access  Private
export const getFeed = async (req, res, next) => {
    try {
        const currentUser = await User.findById(req.user._id);

        // Get posts from users I follow + my own posts
        const followingIds = [...currentUser.following, req.user._id];

        const posts = await Post.find({ author: { $in: followingIds } })
            .populate("author", "name username avatar")
            .populate("comments.user", "name username avatar")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: posts.length,
            posts,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("author", "name username avatar")
            .populate("comments.user", "name username avatar");

        if (!post) {
            res.status(404);
            throw new Error("Post not found");
        }

        res.status(200).json({
            success: true,
            post,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404);
            throw new Error("Post not found");
        }

        // Only author or admin can delete
        if (
            post.author.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            res.status(403);
            throw new Error("Not authorized to delete this post");
        }

        await post.deleteOne();

        res.status(200).json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Like / Unlike post
// @route   PUT /api/posts/:id/like
// @access  Private
export const likePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404);
            throw new Error("Post not found");
        }

        const alreadyLiked = post.likes.includes(req.user._id);

        if (alreadyLiked) {
            post.likes = post.likes.filter(
                (id) => id.toString() !== req.user._id.toString()
            );
        } else {
            post.likes.push(req.user._id);
        }

        await post.save();

        res.status(200).json({
            success: true,
            likes: post.likes.length,
            liked: !alreadyLiked,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
// @access  Private
export const addPostComment = async (req, res, next) => {
    try {
        const { text } = req.body;

        if (!text) {
            res.status(400);
            throw new Error("Comment text is required");
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404);
            throw new Error("Post not found");
        }

        post.comments.unshift({
            user: req.user._id,
            text,
        });

        await post.save();

        const updatedPost = await Post.findById(req.params.id)
            .populate("author", "name username avatar")
            .populate("comments.user", "name username avatar");

        res.status(201).json({
            success: true,
            post: updatedPost,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get posts by user
// @route   GET /api/posts/user/:userId
// @access  Public
export const getUserPosts = async (req, res, next) => {
    try {
        const posts = await Post.find({ author: req.params.userId })
            .populate("author", "name username avatar")
            .populate("comments.user", "name username avatar")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: posts.length,
            posts,
        });
    } catch (error) {
        next(error);
    }
};