import { getConnection, releaseConnection } from "../../config/db/index.js";

// GET /api/v1/category/data
const handleGetCategory = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const query = `SELECT * FROM categories`;
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// GET /api/v1/suppliers/data
const handleGetSuppliers = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const query = `SELECT * FROM suppliers`;
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// GET /api/v1/brands/data
const handleGetBrands = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const query = `SELECT * FROM brands`;
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// GET /api/v1/components/data
const handleGetComponents = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const query = `SELECT * FROM components`;
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};
export {
    handleGetCategory,
    handleGetSuppliers,
    handleGetBrands,
    handleGetComponents,
};
