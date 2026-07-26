import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error("Email sending error:", error.message);
    }
};

export default sendEmail;