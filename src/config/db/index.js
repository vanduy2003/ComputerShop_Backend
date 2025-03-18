import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "benh_vien",
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    connectTimeout: 10000, // ⏳ Thời gian chờ kết nối (đơn vị: ms)
});

// ✅ Hàm lấy một kết nối từ pool
async function getConnection() {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (err) {
        console.error("❌ Lỗi khi lấy kết nối từ pool:", err);
        throw err;
    }
}

// ✅ Hàm giải phóng kết nối sau khi sử dụng
function releaseConnection(connection) {
    if (connection) {
        connection.release();
    }
}

// ✅ Log khi kết nối thành công
console.log("✅ Pool MySQL đã được tạo!");

export { getConnection, releaseConnection };
