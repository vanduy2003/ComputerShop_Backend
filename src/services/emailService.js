import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendVerificationEmail = async (email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Mã xác nhận đăng ký tài khoản",
        text: `Mã xác nhận của bạn là: ${code}. Mã này có hiệu lực trong 5 phút.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Mã xác nhận đã gửi đến: ${email}`);
    } catch (error) {
        console.error("Lỗi gửi email:", error);
    }
};
