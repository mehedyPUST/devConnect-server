import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please add a name"],
            trim: true,
        },
        username: {
            type: String,
            required: [true, "Please add a username"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Please add an email"],
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            minlength: 6,
            select: false,
        },
        avatar: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            default: "",
        },
        skills: {
            type: [String],
            default: [],
        },
        location: {
            type: String,
            default: "",
        },
        github: {
            type: String,
            default: "",
        },
        linkedin: {
            type: String,
            default: "",
        },
        website: {
            type: String,
            default: "",
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        githubId: String,
        githubStats: {
            publicRepos: Number,
            followers: Number,
            following: Number,
            totalStars: Number,
            topLanguages: [String],
        },
        isBanned: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;