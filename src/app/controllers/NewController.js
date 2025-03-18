import { getConnection, releaseConnection } from "../../config/db/index.js";
// GET /api/v1/data/news
const handleGetNews = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const query = `SELECT * FROM news`;
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy tin tức:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

const handleGetNewById = async (req, res) => {
    let connection;
    try {
        const newId = req.params.id;
        connection = await getConnection();
        const query = `SELECT * FROM news WHERE newId = ${newId}`;
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy tin tức:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

export { handleGetNews, handleGetNewById };
