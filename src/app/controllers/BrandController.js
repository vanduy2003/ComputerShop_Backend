import { getConnection, releaseConnection } from "../../config/db/index.js";

// GET /api/v1/brand/data
const handleGetBrand = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const query = `SELECT * FROM brands`;
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy thương hiệu:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

export { handleGetBrand };
