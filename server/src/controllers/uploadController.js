import cloudinary from "../config/cloudinary.js";

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private
export const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400);
            throw new Error("Please upload a file");
        }

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: "devconnect",
            width: 1200,
            height: 800,
            crop: "limit",
            quality: "auto",
        });

        res.status(200).json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload
// @access  Private
export const deleteImage = async (req, res, next) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            res.status(400);
            throw new Error("Public ID is required");
        }

        await cloudinary.uploader.destroy(publicId);

        res.status(200).json({
            success: true,
            message: "Image deleted",
        });
    } catch (error) {
        next(error);
    }
};