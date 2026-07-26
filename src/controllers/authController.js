import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

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

        // Check if user already exists
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

            // Send welcome email (optional - won't break if email fails)
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