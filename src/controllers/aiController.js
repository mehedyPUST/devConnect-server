// @desc    Generate project description
// @route   POST /api/ai/generate-description
// @access  Private
export const generateDescription = async (req, res, next) => {
    try {
        const { title, techStack, keywords } = req.body;

        if (!title) {
            res.status(400);
            throw new Error("Project title is required");
        }

        if (!process.env.GROQ_API_KEY) {
            res.status(500);
            throw new Error("AI service is not configured. Please add GROQ_API_KEY to environment variables.");
        }

        const GroqSDK = (await import("groq-sdk")).default;
        const groqClient = new GroqSDK({
            apiKey: process.env.GROQ_API_KEY,
        });

        const techs = techStack?.length ? techStack.join(", ") : "various technologies";
        const keys = keywords || "";

        const prompt = `Write a professional and engaging project description for a developer portfolio.

Project Title: ${title}
Technologies Used: ${techs}
Key Features: ${keys}

Write a description that includes:
1. A compelling overview (2-3 sentences)
2. Key features and functionality (3-4 bullet points)
3. Technical highlights

Keep it professional, clear, and around 150-200 words. Do not use markdown formatting.`;

        const completion = await groqClient.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional technical writer specializing in developer portfolios and project descriptions.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 500,
        });

        const description = completion.choices[0]?.message?.content || "Failed to generate description";

        res.status(200).json({
            success: true,
            description: description.trim(),
        });
    } catch (error) {
        console.error("AI generation error:", error);
        res.status(500).json({
            success: false,
            message: "AI generation failed. Please try again.",
        });
    }
};

// @desc    Review project
// @route   POST /api/ai/review-project
// @access  Private
export const reviewProject = async (req, res, next) => {
    try {
        const { title, description, techStack } = req.body;

        if (!title || !description) {
            res.status(400);
            throw new Error("Title and description are required");
        }

        if (!process.env.GROQ_API_KEY) {
            res.status(500);
            throw new Error("AI service is not configured. Please add GROQ_API_KEY to environment variables.");
        }

        const GroqSDK = (await import("groq-sdk")).default;
        const groqClient = new GroqSDK({
            apiKey: process.env.GROQ_API_KEY,
        });

        const techs = techStack?.length ? techStack.join(", ") : "not specified";

        const prompt = `Review this developer project and provide constructive feedback:

Project Title: ${title}
Description: ${description}
Technologies: ${techs}

Provide feedback in this format:
1. Overall Score (out of 10)
2. Strengths (3 bullet points)
3. Areas for Improvement (3 bullet points)
4. Suggestions for better presentation (2 bullet points)

Keep feedback constructive, professional, and actionable.`;

        const completion = await groqClient.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an experienced senior developer providing constructive project feedback.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 600,
        });

        const review = completion.choices[0]?.message?.content || "Failed to generate review";

        res.status(200).json({
            success: true,
            review: review.trim(),
        });
    } catch (error) {
        console.error("AI review error:", error);
        res.status(500).json({
            success: false,
            message: "AI review failed. Please try again.",
        });
    }
};