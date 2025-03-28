import { getConnection, releaseConnection } from "../../config/db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../../services/emailService.js";

const verificationCodes = new Map(); // Lưu tạm mã xác nhận
const SECRET_KEY = "your_secret_key"; // Nên lưu trong biến môi trường

// Hàm đăng nhập
const handleDataLogin = async (req, res) => {
    let connection; // 🔴 Định nghĩa trước để tránh lỗi trong `finally`
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Vui lòng nhập đầy đủ thông tin" });
        }

        connection = await getConnection(); // 🔗 Lấy kết nối từ pool
        const [rows] = await connection.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        const user = rows[0];
        if (!user) {
            return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Sai email hoặc mật khẩu" });
        }

        // Tạo token JWT
        const token = jwt.sign(
            { userId: user.userId, role: user.role }, // Thêm role vào token
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 3600 * 1000, // 1 giờ
            path: "/",
        }).json({ message: "Đăng nhập thành công", user });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        if (connection) releaseConnection(connection); // ✅ Kiểm tra connection trước khi giải phóng
    }
};

// Hàm lấy thông tin user từ token
const handleDataMe = async (req, res) => {
    let connection; // 🔴 Định nghĩa trước
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Chưa đăng nhập" });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        connection = await getConnection(); // 🔗 Lấy kết nối từ pool
        const [rows] = await connection.execute(
            "SELECT * FROM users WHERE userId = ?",
            [decoded.userId]
        );

        const me = rows[0];
        if (!me) {
            return res.status(401).json({ message: "User không tồn tại" });
        }

        return res.json(me);
    } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        if (connection) releaseConnection(connection); // ✅ Kiểm tra connection trước khi giải phóng
    }
};

// Hàm đăng xuất
const handleDataLogout = async (req, res) => {
    try {
        res.clearCookie("token", { path: "/" });
        return res.json({ message: "Đăng xuất thành công" });
    } catch (error) {
        console.error("Lỗi đăng xuất:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

// Hàm đăng ký
const handleDataRegister = async (req, res) => {
    let connection;
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res
                .status(400)
                .json({ message: "Vui lòng nhập đầy đủ thông tin" });
        }

        connection = await getConnection();

        // Kiểm tra email đã tồn tại chưa
        const [existingUser] = await connection.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email đã được sử dụng" });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Thêm user vào database
        await connection.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );

        return res.status(201).json({ message: "Đăng ký thành công" });
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// Hàm gửi mã xác nhận
const sendVerificationCode = async (req, res) => {
    let connection;
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Vui lòng nhập email" });
        }

        connection = await getConnection();
        const [existingUser] = await connection.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email đã tồn tại" });
        }

        const code = Math.floor(10000 + Math.random() * 90000); // 5 chữ số
        verificationCodes.set(email, code);

        await sendVerificationEmail(email, code);
        return res.json({ message: "Mã xác nhận đã được gửi" });
    } catch (error) {
        console.error("Lỗi gửi mã xác nhận:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// Hàm xác nhận mã
const verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res
                .status(400)
                .json({ message: "Vui lòng nhập đầy đủ thông tin" });
        }

        if (verificationCodes.get(email) != code) {
            return res
                .status(400)
                .json({ message: "Mã xác nhận không đúng hoặc đã hết hạn" });
        }

        verificationCodes.delete(email);
        return res.json({ message: "Xác nhận thành công" });
    } catch (error) {
        console.error("Lỗi xác thực mã:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

// Hàm gửi mã xác nhận reset mật khẩu
const sendResetPasswordCode = async (req, res) => {
    let connection;
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Vui lòng nhập email" });
        }

        connection = await getConnection();
        const [users] = await connection.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Email không tồn tại!" });
        }

        // Tạo mã xác nhận ngẫu nhiên
        const code = Math.floor(10000 + Math.random() * 90000);
        verificationCodes.set(email, code);

        // Gửi email chứa mã xác nhận
        await sendVerificationEmail(email, code);

        res.json({ message: "Mã xác nhận đã được gửi!" });
    } catch (error) {
        console.error("Lỗi gửi mã xác nhận:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// Hàm xác nhận mã reset mật khẩu
const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!verificationCodes.has(email)) {
            return res
                .status(400)
                .json({ message: "Mã xác nhận không hợp lệ!" });
        }

        if (verificationCodes.get(email) != code) {
            return res.status(400).json({ message: "Mã xác nhận không đúng!" });
        }

        verificationCodes.delete(email); // Xoá mã sau khi xác nhận thành công
        res.json({ message: "Xác nhận thành công!", success: true });
    } catch (error) {
        console.error("Lỗi xác nhận mã:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// Hàm reset mật khẩu
const resetPassword = async (req, res) => {
    let connection;
    try {
        const { email, newPassword } = req.body;

        connection = await getConnection();
        const [users] = await connection.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Email không hợp lệ!" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await connection.execute(
            "UPDATE users SET password = ? WHERE email = ?",
            [hashedPassword, email]
        );

        res.json({ message: "Mật khẩu đã được đặt lại thành công!" });
    } catch (error) {
        console.error("Lỗi đặt lại mật khẩu:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// Hàm đăng nhập bằng Google
const googleLogin = async (req, res) => {
    let connection;
    try {
        const { email, displayName, photoURL } = req.body;

        if (!email || !displayName) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }

        connection = await getConnection();

        // Kiểm tra xem user đã tồn tại chưa
        const [existingUser] = await connection.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        let user;

        if (existingUser.length > 0) {
            // User đã tồn tại => Đăng nhập
            user = existingUser[0];
        } else {
            // User chưa tồn tại => Tạo user mới
            const [result] = await connection.execute(
                "INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)",
                [displayName, email, "", photoURL]
            );

            // Lấy user vừa tạo
            const [newUser] = await connection.execute(
                "SELECT * FROM users WHERE userId = ?",
                [result.insertId]
            );

            user = newUser[0];
        }

        // Tạo token JWT
        const token = jwt.sign({ userId: user.userId }, SECRET_KEY, {
            expiresIn: "1h",
        });

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 3600 * 1000, // 1 giờ
            path: "/",
        }).json({ message: "Đăng nhập Google thành công", user });
    } catch (error) {
        console.error("Lỗi đăng nhập Google:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// Lấy tất cả user
const getAllUsers = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [users] = await connection.execute("SELECT * FROM users");
        res.json(users);
    } catch (error) {
        console.error("Lỗi lấy danh sách user:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

const deleteUser = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        await connection.execute("DELETE FROM users WHERE userId = ?", [id]);
        res.json({ message: "Xóa user thành công" });
    } catch (error) {
        console.error("Lỗi xóa user:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

export {
    handleDataLogin,
    handleDataMe,
    handleDataLogout,
    handleDataRegister,
    sendVerificationCode,
    verifyCode,
    sendResetPasswordCode,
    verifyResetCode,
    resetPassword,
    googleLogin,
    getAllUsers,
    deleteUser,
};
