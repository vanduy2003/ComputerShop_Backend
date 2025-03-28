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

// POST /api/v1/data/category/add-category
const handleAddCategory = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { name, description, imageUrl } = req.body;
        const query = `INSERT INTO categories (name, description, imageUrl) VALUES (?, ?, ?)`;
        const [result] = await connection.execute(query, [
            name,
            description,
            imageUrl,
        ]);
        const newCategory = {
            categoryId: result.insertId,
            name,
            description,
            imageUrl,
        };
        res.json(newCategory);
    } catch (error) {
        console.error("Lỗi khi thêm danh mục:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// PUT /api/v1/data/category/update-category/:id
const handleUpdateCategory = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { name, description, imageUrl } = req.body;
        const { id } = req.params;
        const query = `UPDATE categories SET name = ?, description = ?, imageUrl = ? WHERE categoryId = ?`;
        await connection.execute(query, [name, description, imageUrl, id]);
        res.json({ id, name, description, imageUrl });
    } catch (error) {
        console.error("Lỗi khi cập nhật danh mục:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// DELETE /api/v1/data/category/delete-category/:id
const handleDeleteCategory = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id } = req.params;
        const query = `DELETE FROM categories WHERE categoryId = ?`;
        await connection.execute(query, [id]);
        res.json({ id });
    } catch (error) {
        console.error("Lỗi khi xóa danh mục:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

const handleAddSupplier = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { name, address, phone, contactName, email, imageUrl } = req.body;

        if (
            !name ||
            !address ||
            !phone ||
            !contactName ||
            !email ||
            !imageUrl
        ) {
            return res.status(400).json({ message: "Thiếu thông tin" });
        }

        const query = `INSERT INTO suppliers (name, address, phone, contactName, email, imageUrl) VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await connection.execute(query, [
            name,
            address,
            phone,
            contactName,
            email,
            imageUrl,
        ]);
        const newSupplier = {
            supplierId: result.insertId,
            name,
            address,
            phone,
            contactName,
            email,
            imageUrl,
        };
        res.status(201).json({ success: true, newSupplier });
    } catch (error) {
        console.error("Lỗi khi thêm nhà cung cấp:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// PUT /api/v1/data/suppliers/update-supplier/:id
const handleUpdateSupplier = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { name, address, phone, contactName, email, imageUrl } = req.body;
        const { id } = req.params;

        // 🛑 Kiểm tra dữ liệu đầu vào
        if (!id || !name || !address || !phone || !contactName || !email) {
            return res
                .status(400)
                .json({ message: "Thiếu thông tin cập nhật" });
        }

        // 🔍 Kiểm tra nhà cung cấp có tồn tại không
        const [rows] = await connection.execute(
            "SELECT supplierId FROM suppliers WHERE supplierId = ?",
            [id]
        );
        if (rows.length === 0) {
            return res
                .status(404)
                .json({ message: "Nhà cung cấp không tồn tại" });
        }

        // 📝 Cập nhật thông tin nhà cung cấp + updatedAt
        const query = `
            UPDATE suppliers 
            SET name = ?, address = ?, phone = ?, contactName = ?, email = ?, imageUrl = ?, updatedAt = NOW() 
            WHERE supplierId = ?
        `;
        const [result] = await connection.execute(query, [
            name,
            address,
            phone,
            contactName,
            email,
            imageUrl,
            id,
        ]);

        // 🛑 Kiểm tra cập nhật có thành công không
        if (result.affectedRows === 0) {
            return res.status(500).json({ message: "Cập nhật thất bại" });
        }

        res.json({
            success: true,
            message: "Cập nhật nhà cung cấp thành công",
            supplier: {
                id,
                name,
                address,
                phone,
                contactName,
                email,
                imageUrl,
                updatedAt: new Date().toISOString(), // Trả về thời gian cập nhật
            },
        });
    } catch (error) {
        console.error("🚨 Lỗi khi cập nhật nhà cung cấp:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// DELETE /api/v1/data/suppliers/delete-supplier/:id
const handleDeleteSupplier = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id } = req.params;

        // 🔍 Kiểm tra nhà cung cấp có tồn tại không
        const [rows] = await connection.execute(
            "SELECT supplierId FROM suppliers WHERE supplierId = ?",
            [id]
        );
        if (rows.length === 0) {
            return res
                .status(404)
                .json({ message: "Nhà cung cấp không tồn tại" });
        }

        // 🗑️ Xóa nhà cung cấp
        const query = `DELETE FROM suppliers WHERE supplierId = ?`;
        const [result] = await connection.execute(query, [id]);

        // 🛑 Kiểm tra xóa có thành công không
        if (result.affectedRows === 0) {
            return res.status(500).json({ message: "Xóa thất bại" });
        }

        res.json({
            success: true,
            message: "Xóa nhà cung cấp thành công",
            supplierId: id,
        });
    } catch (error) {
        console.error("🚨 Lỗi khi xóa nhà cung cấp:", error);
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
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddSupplier,
    handleUpdateSupplier,
    handleDeleteSupplier,
};
