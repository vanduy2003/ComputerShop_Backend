import { getConnection, releaseConnection } from "../../config/db/index.js";
// GET /api/v1/data/news
const handleGetNews = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const query = `SELECT n.*, u.username FROM news n LEFT JOIN users u on n.authorId = u.userId`;
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy tin tức:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// GET /api/v1/data/news/:id
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

// POST /api/v1/data/news
const handleAddNew = async (req, res) => {
    let connection;
    try {
        const { title, thumbnail, type, description, content, authorId } =
            req.body;

        if (!title || !thumbnail || !type || !content || !authorId) {
            return res
                .status(400)
                .json({ success: false, message: "Thiếu dữ liệu bài viết!" });
        }
        connection = await getConnection();
        const query = `INSERT INTO news (title, thumbnail, type, description, content, authorId) VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await connection.execute(query, [
            title,
            thumbnail,
            type,
            description,
            content,
            authorId,
        ]);
        const newId = result.insertId;
        const [rows] = await connection.execute(
            `SELECT * FROM news WHERE newId = ${newId}`
        );
        res.json({ success: true, newArticle: rows[0] });
    } catch (error) {
        console.error("Lỗi khi thêm tin tức:", error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// PUT /api/v1/data/news/:id
const handleUpdateNew = async (req, res) => {
    let connection;
    try {
        const newId = req.params.id;
        const { title, thumbnail, type, description, content, videoUrl } =
            req.body;
        if (!title || !thumbnail || !type || !content) {
            return res
                .status(400)
                .json({ success: false, message: "Thiếu dữ liệu bài viết!" });
        }
        connection = await getConnection();
        const query = `UPDATE news SET title = ?, thumbnail = ?, type = ?, description = ?, content = ?, videoUrl = ? WHERE newId = ?`;
        await connection.execute(query, [
            title,
            thumbnail,
            type,
            description,
            content,
            videoUrl,
            newId,
        ]);
        res.json({ success: true });
    } catch (error) {
        console.error("Lỗi khi cập nhật tin tức:", error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// DELETE /api/v1/data/news/:id
const handleDeleteNew = async (req, res) => {
    let connection;
    try {
        const newId = req.params.id;
        connection = await getConnection();
        const query = `DELETE FROM news WHERE newId = ?`;
        await connection.execute(query, [newId]);
        res.json({ success: true });
    } catch (error) {
        console.error("Lỗi khi xóa tin tức:", error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

export {
    handleGetNews,
    handleGetNewById,
    handleAddNew,
    handleUpdateNew,
    handleDeleteNew,
};
