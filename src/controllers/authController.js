import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import axios from "axios";

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            res.status(400);
            throw new Error("Please provide all fields");
        }

        const userExists = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (userExists) {
            res.status(400);
            throw new Error("User already exists with this email or username");
        }

        const user = await User.create({
            name,
            username,
            email,
            password,
        });

        if (user) {
            generateToken(res, user._id);

            await sendEmail({
                to: user.email,
                subject: "Welcome to DevConnect!",
                html: `
          <h2>Hi ${user.name},</h2>
          <p>Welcome to <strong>DevConnect</strong> — the platform where developers showcase their work and connect.</p>
          <p>Start by creating your first project!</p>
        `,
            });

            res.status(201).json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                },
            });
        } else {
            res.status(400);
            throw new Error("Invalid user data");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error("Please provide email and password");
        }

        const user = await User.findOne({ email }).select("+password");

        if (user && (await user.matchPassword(password))) {
            if (user.isBanned) {
                res.status(403);
                throw new Error("Your account has been banned");
            }

            generateToken(res, user._id);

            res.status(200).json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                },
            });
        } else {
            res.status(401);
            throw new Error("Invalid email or password");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    GitHub OAuth - Redirect to GitHub
// @route   GET /api/auth/github
// @access  Public
export const githubAuth = (req, res) => {
    const redirectUri = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:read`;
    res.redirect(redirectUri);
};

// @desc    GitHub OAuth Callback
// @route   GET /api/auth/github/callback
// @access  Public
export const githubCallback = async (req, res, next) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
        }

        // Exchange code for access token
        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            },
            {
                headers: { Accept: "application/json" },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        if (!accessToken) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_failed`);
        }

        // Get GitHub user data
        const userResponse = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const githubUser = userResponse.data;

        // Get GitHub repos for stats
        let githubStats = {};
        try {
            const reposResponse = await axios.get("https://api.github.com/user/repos", {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { per_page: 100, sort: "updated" },
            });

            const repos = reposResponse.data;
            const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
            const languages = repos
                .filter((repo) => repo.language)
                .map((repo) => repo.language);
            const topLanguages = [...new Set(languages)].slice(0, 5);

            githubStats = {
                publicRepos: githubUser.public_repos,
                followers: githubUser.followers,
                following: githubUser.following,
                totalStars,
                topLanguages,
            };
        } catch (statsError) {
            console.error("GitHub stats error:", statsError.message);
        }

        // Check if user exists
        let user = await User.findOne({ githubId: githubUser.id.toString() });

        if (user) {
            // Update GitHub stats
            user.githubStats = githubStats;
            user.avatar = user.avatar || githubUser.avatar_url;
            await user.save();
        } else {
            // Check if email exists
            const email = githubUser.email || `${githubUser.login}@github.com`;

            // Check if email already registered
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                // Link GitHub to existing account
                existingUser.githubId = githubUser.id.toString();
                existingUser.githubStats = githubStats;
                existingUser.avatar = existingUser.avatar || githubUser.avatar_url;
                await existingUser.save();
                user = existingUser;
            } else {
                // Create new user
                user = await User.create({
                    name: githubUser.name || githubUser.login,
                    username: githubUser.login + Math.floor(Math.random() * 1000),
                    email,
                    password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
                    avatar: githubUser.avatar_url,
                    githubId: githubUser.id.toString(),
                    bio: githubUser.bio || "",
                    location: githubUser.location || "",
                    github: githubUser.html_url,
                    githubStats,
                });
            }
        }

        // Generate token
        generateToken(res, user._id);

        // Redirect to frontend
        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (error) {
        console.error("GitHub OAuth error:", error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
};