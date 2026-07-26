import Project from "../models/Project.js";

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res, next) => {
    try {
        const { title, description, techStack, liveUrl, githubUrl, images } = req.body;

        const project = await Project.create({
            title,
            description,
            techStack,
            liveUrl,
            githubUrl,
            images,
            owner: req.user._id,
        });

        res.status(201).json({
            success: true,
            project,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
export const getProjects = async (req, res, next) => {
    try {
        const projects = await Project.find()
            .populate("owner", "name username avatar")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
export const getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate("owner", "name username avatar bio skills")
            .populate("comments.user", "name username avatar");

        if (!project) {
            res.status(404);
            throw new Error("Project not found");
        }

        // Increase view count
        project.views += 1;
        await project.save();

        res.status(200).json({
            success: true,
            project,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req, res, next) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            res.status(404);
            throw new Error("Project not found");
        }

        // Check ownership
        if (project.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            res.status(403);
            throw new Error("Not authorized to update this project");
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            project,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            res.status(404);
            throw new Error("Project not found");
        }

        if (project.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            res.status(403);
            throw new Error("Not authorized to delete this project");
        }

        await project.deleteOne();

        res.status(200).json({
            success: true,
            message: "Project deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Like / Unlike project
// @route   PUT /api/projects/:id/like
// @access  Private
export const likeProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            res.status(404);
            throw new Error("Project not found");
        }

        const alreadyLiked = project.likes.includes(req.user._id);

        if (alreadyLiked) {
            project.likes = project.likes.filter(
                (id) => id.toString() !== req.user._id.toString()
            );
        } else {
            project.likes.push(req.user._id);
        }

        await project.save();

        res.status(200).json({
            success: true,
            likes: project.likes.length,
            liked: !alreadyLiked,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add comment
// @route   POST /api/projects/:id/comment
// @access  Private
export const addComment = async (req, res, next) => {
    try {
        const { text } = req.body;

        if (!text) {
            res.status(400);
            throw new Error("Comment text is required");
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            res.status(404);
            throw new Error("Project not found");
        }

        const comment = {
            user: req.user._id,
            text,
        };

        project.comments.unshift(comment);
        await project.save();

        const updatedProject = await Project.findById(req.params.id).populate(
            "comments.user",
            "name username avatar"
        );

        res.status(201).json({
            success: true,
            comments: updatedProject.comments,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get projects of a specific user
// @route   GET /api/projects/user/:userId
// @access  Public
export const getUserProjects = async (req, res, next) => {
    try {
        const projects = await Project.find({ owner: req.params.userId })
            .populate("owner", "name username avatar")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects,
        });
    } catch (error) {
        next(error);
    }
};