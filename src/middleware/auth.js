import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        if (req.user.isBanned) {
            return res.status(403).json({
                success: false,
                message: "Your account has been banned",
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, token failed",
        });
    }
};

// Restrict to specific roles
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this route`,
            });
        }
        next();
    };
};