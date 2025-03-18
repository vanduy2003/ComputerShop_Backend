import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import appCpmputer from "./routers/index.js";
import cors from "cors";

const app = express();

app.use(cookieParser());
// Cho phép tất cả các origin truy cập API
app.use(
    cors({
        origin: "http://localhost:8080",
        credentials: true,
    })
);

// Hoặc chỉ cho phép Vue.js truy cập API
// app.use(cors({ origin: "http://localhost:8080" }));

app.use(express.json()); // Middleware để đọc JSON request
app.use(express.urlencoded({ extended: true })); // Middleware để đọc dữ liệu từ form

// Lấy đường dẫn file hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Static file
app.use(express.static(path.join(__dirname, "public")));

// Đăng ký router (Phải đặt sau khi app.use(cors()))
appCpmputer(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ Server đang chạy trên http://localhost:${port}`);
});
