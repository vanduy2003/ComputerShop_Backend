import express from "express";
const router = express.Router();
import * as hendleLogin from "../app/controllers/LoginController.js";

// Api đăng nhập
router.post("/api/v1/auth/login", hendleLogin.handleDataLogin);
// Api lấy thông tin user từ token
router.get("/api/v1/auth/me", hendleLogin.handleDataMe);
// Api đăng xuất
router.post("/api/v1/auth/logout", hendleLogin.handleDataLogout);
// Api đăng ký
router.post("/api/v1/auth/register", hendleLogin.handleDataRegister);
// Api gửi mã xác thực
router.post(
    "/api/v1/auth/send-verification-code",
    hendleLogin.sendVerificationCode
);
// Api xác thực mã
router.post("/api/v1/auth/verify-code", hendleLogin.verifyCode);
// Api gửi mã xác thực để reset mật khẩu
router.post(
    "/api/v1/auth/sendResetPasswordCode",
    hendleLogin.sendResetPasswordCode
);
// Api xác thực mã để reset mật khẩu
router.post("/api/v1/auth/verifyResetCode", hendleLogin.verifyResetCode);
// Api reset mật khẩu
router.post("/api/v1/auth/resetPassword", hendleLogin.resetPassword);
// Api đăng nhập bằng Google
router.post("/api/v1/auth/google-login", hendleLogin.googleLogin);

// Api lấy tất cả user
router.get("/api/v1/data/users", hendleLogin.getAllUsers);
// Api xóa user
router.delete("/api/v1/data/delete-user/:id", hendleLogin.deleteUser);

export default router;
