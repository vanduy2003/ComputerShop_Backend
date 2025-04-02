import { getConnection, releaseConnection } from "../../config/db/index.js";

// GET /api/v1/data/products
const handleGetProduct = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const query = `SELECT 
        p.*, 
        c.name AS categoryName, 
        c.description AS categoryDescription, 
        c.imageUrl AS categoryImage,
        s.name AS supplierName
        FROM products p
        LEFT JOIN categories c ON p.categoryId = c.categoryId
        LEFT JOIN suppliers s ON p.supplierId = s.supplierId`; // Lấy tất cả sản phẩm
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// GET /api/v1/data/products/:id
const handleGetProductById = async (req, res) => {
    let connection;
    try {
        const productId = req.params.id;
        connection = await getConnection();
        const query = `SELECT
    p.*,
    c.name AS categoryName,
    b.name AS brandName,
    b.logoUrl AS brandImg,

    -- Chuyển danh sách ảnh thành chuỗi JSON hợp lệ (không ép kiểu JSON)
    CONCAT('[', GROUP_CONCAT(DISTINCT CONCAT('"', i.imageUrl, '"') SEPARATOR ','), ']') AS imageDetail,

    -- Chuyển danh sách components thành chuỗi JSON hợp lệ
    CONCAT('[', GROUP_CONCAT(DISTINCT 
        CONCAT(
            '{"componentId": "', comp.componentId, 
            '", "name": "', comp.name, 
            '", "componentType": "', comp.componentType, 
            '", "specifications": "', comp.specifications, 
            '", "quantity": "', pc.quantity, '"}'
        ) 
    SEPARATOR ','), ']') AS components

    FROM products p
    LEFT JOIN brands b ON p.brandId = b.brandId
    LEFT JOIN imagedetail i ON p.productId = i.productId
    LEFT JOIN categories c ON p.categoryId = c.categoryId
    LEFT JOIN productcomponents pc ON p.productId = pc.productId
    LEFT JOIN components comp ON pc.componentId = comp.componentId
    WHERE p.productId = ${productId}
    GROUP BY p.productId
    LIMIT 25;`;
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
        res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// POST /api/v1/data/cart
const handleAddToCart = async (req, res) => {
    let connection;
    try {
        const { userId, productId, quantity } = req.body;
        if (!userId || !productId || !quantity) {
            return res
                .status(400)
                .json({ message: "Thiếu thông tin giỏ hàng" });
        }

        connection = await getConnection();

        // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
        const [existingCart] = await connection.execute(
            "SELECT * FROM cart WHERE userId = ? AND productId = ?",
            [userId, productId]
        );

        if (existingCart.length > 0) {
            // Nếu sản phẩm đã có, cập nhật số lượng
            await connection.execute(
                "UPDATE cart SET quantity = quantity + ? WHERE userId = ? AND productId = ?",
                [quantity, userId, productId]
            );
        } else {
            // Nếu chưa có, thêm mới
            await connection.execute(
                "INSERT INTO cart (userId, productId, quantity) VALUES (?, ?, ?)",
                [userId, productId, quantity]
            );
        }

        return res.json({ message: "Thêm vào giỏ hàng thành công" });
    } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// GET /api/v1/data/get-cart/:id
const handleGetCart = async (req, res) => {
    let connection;
    try {
        const { id: userId } = req.params; // Lấy userId từ params

        if (!userId) {
            return res.status(400).json({ message: "Thiếu userId" });
        }

        connection = await getConnection();
        const [cartItems] = await connection.execute(
            `SELECT 
    c.cartId, 
    c.productId, 
    c.quantity, 
    p.name, 
    p.priceOld,
    p.priceNew,
    p.imageUrl,
    
    -- Chuyển danh sách components thành chuỗi JSON hợp lệ
    CONCAT('[', GROUP_CONCAT(DISTINCT 
        CONCAT(
            '{"componentId": "', comp.componentId, 
            '", "component_name": "', comp.name, 
            '", "componentType": "', comp.componentType, 
            '", "specifications": "', comp.specifications, 
            '", "quantity": "', pc.quantity, '"}'
        ) 
    SEPARATOR ','), ']') AS components

FROM cart c
JOIN products p ON c.productId = p.productId
LEFT JOIN productcomponents pc ON p.productId = pc.productId
LEFT JOIN components comp ON pc.componentId = comp.componentId

WHERE c.userId = ?
GROUP BY c.cartId;
`,
            [userId]
        );

        return res.json(cartItems);
    } catch (error) {
        console.error("Lỗi lấy giỏ hàng:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// DELETE /api/v1/data/delete-cart/:id
const handleDeleteCart = async (req, res) => {
    let connection;
    try {
        const { id: cartId } = req.params; // Lấy cartId từ params

        if (!cartId) {
            return res.status(400).json({ message: "Thiếu cartId" });
        }

        connection = await getConnection();
        await connection.execute("DELETE FROM cart WHERE cartId = ?", [cartId]);

        return res.json({ success: true, message: "Xóa sản phẩm thành công!" });
    } catch (error) {
        console.error("Lỗi xóa giỏ hàng:", error);
        return res
            .status(500)
            .json({ success: false, message: "Lỗi server", error });
    } finally {
        releaseConnection(connection);
    }
};

// PUT /api/v1/data/update-cart
const handleUpdateCart = async (req, res) => {
    let connection;
    try {
        const { cartId, quantity } = req.body;

        if (!cartId || quantity === undefined) {
            return res
                .status(400)
                .json({ message: "Thiếu thông tin cập nhật" });
        }

        connection = await getConnection();

        if (quantity > 0) {
            // Nếu số lượng hợp lệ, cập nhật giỏ hàng
            await connection.execute(
                "UPDATE cart SET quantity = ? WHERE cartId = ?",
                [quantity, cartId]
            );
            return res.json({
                success: true,
                message: "Cập nhật giỏ hàng thành công",
            });
        } else {
            // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ hàng
            await connection.execute("DELETE FROM cart WHERE cartId = ?", [
                cartId,
            ]);
            return res.json({
                success: true,
                message: "Đã xóa sản phẩm khỏi giỏ hàng",
            });
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật giỏ hàng:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        releaseConnection(connection);
    }
};

// POST /api/v1/data/product-add
const handleProductAdd = async (req, res) => {
    let connection;
    try {
        const {
            name,
            priceOld,
            priceNew,
            imageUrl,
            sale,
            stockQuantity,
            categoryId,
            supplierId,
            brandId,
            highlightType,
            descHTML,
            components,
            imageDetails, // 🆕 Thêm danh sách ảnh chi tiết
        } = req.body;

        if (
            !name ||
            !priceOld ||
            !priceNew ||
            !imageUrl ||
            !sale ||
            !stockQuantity ||
            !categoryId ||
            !supplierId ||
            !brandId ||
            !highlightType ||
            !descHTML
        ) {
            return res
                .status(400)
                .json({ message: "Thiếu thông tin sản phẩm" });
        }

        connection = await getConnection();

        // 🟢 Thêm sản phẩm vào bảng products
        const [result] = await connection.execute(
            "INSERT INTO products (name, priceOld, priceNew, imageUrl, sale, stockQuantity, categoryId, supplierId, brandId, highlightType, descHTML) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                name,
                priceOld,
                priceNew,
                imageUrl,
                sale,
                stockQuantity,
                categoryId,
                supplierId,
                brandId,
                highlightType,
                descHTML,
            ]
        );
        const productId = result.insertId; // 🆕 Lấy ID sản phẩm vừa thêm

        // 🟢 Thêm các linh kiện vào bảng productcomponents nếu có
        if (components && components.length > 0) {
            const componentValues = components.map((c) => [
                productId,
                c.componentId,
                c.quantity,
            ]);
            await connection.query(
                "INSERT INTO productcomponents (productId, componentId, quantity) VALUES ?",
                [componentValues]
            );
        }

        // 🟢 Thêm danh sách ảnh chi tiết vào bảng imagedetail nếu có
        if (imageDetails && imageDetails.length > 0) {
            const imageValues = imageDetails.map((img) => [
                productId,
                img.imageUrl,
            ]);
            await connection.query(
                "INSERT INTO imagedetail (productId, imageUrl) VALUES ?",
                [imageValues]
            );
        }

        res.status(201).json({
            message: "Thêm sản phẩm thành công",
            productId,
        });
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        if (connection) releaseConnection(connection);
    }
};

// DELETE /api/v1/data/product-delete/:id
const handleProductDelete = async (req, res) => {
    let connection;
    try {
        const productId = req.params.id;

        if (!productId) {
            return res.status(400).json({ message: "Thiếu ID sản phẩm" });
        }

        connection = await getConnection();

        // Xóa các linh kiện liên quan trong bảng productcomponents
        await connection.execute(
            "DELETE FROM productcomponents WHERE productId = ?",
            [productId]
        );

        // Xóa sản phẩm trong bảng products
        const [result] = await connection.execute(
            "DELETE FROM products WHERE productId = ?",
            [productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        res.status(200).json({ message: "Xóa sản phẩm thành công" });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        if (connection) releaseConnection(connection);
    }
};

// PUT /api/v1/data/product-update
const handleProductUpdate = async (req, res) => {
    let connection;
    try {
        const {
            productId,
            name,
            priceOld,
            priceNew,
            imageUrl,
            sale,
            stockQuantity,
            categoryId,
            supplierId,
            brandId,
            highlightType,
            descHTML,
            components,
            imageDetails, // 🆕 Thêm danh sách ảnh chi tiết
        } = req.body;

        if (
            !productId ||
            !name ||
            !priceOld ||
            !priceNew ||
            !imageUrl ||
            !sale ||
            !stockQuantity ||
            !categoryId ||
            !supplierId ||
            !brandId ||
            !highlightType ||
            !descHTML
        ) {
            return res
                .status(400)
                .json({ message: "Thiếu thông tin sản phẩm" });
        }

        connection = await getConnection();

        // Cập nhật thông tin sản phẩm trong bảng products
        await connection.execute(
            `UPDATE products SET 
            name = ?, 
            priceOld = ?, 
            priceNew = ?, 
            imageUrl = ?, 
            sale = ?, 
            stockQuantity = ?, 
            categoryId = ?, 
            supplierId = ?, 
            brandId = ?, 
            highlightType = ?, 
            descHTML = ?
            WHERE productId = ?`,
            [
                name,
                priceOld,
                priceNew,
                imageUrl,
                sale,
                stockQuantity,
                categoryId,
                supplierId,
                brandId,
                highlightType,
                descHTML,
                productId,
            ]
        );

        // Xóa các linh kiện liên quan trong bảng productcomponents
        await connection.execute(
            "DELETE FROM productcomponents WHERE productId = ?",
            [productId]
        );

        // Thêm các linh kiện vào productcomponents nếu có
        if (components && components.length > 0) {
            const componentValues = components.map((c) => [
                productId,
                c.componentId,
                c.quantity,
            ]);
            await connection.query(
                "INSERT INTO productcomponents (productId, componentId, quantity) VALUES ?",
                [componentValues]
            );
        }

        // 🔥 Cập nhật danh sách ảnh chi tiết
        if (imageDetails && imageDetails.length > 0) {
            // Xóa tất cả ảnh chi tiết cũ
            await connection.execute(
                "DELETE FROM imagedetail WHERE productId = ?",
                [productId]
            );

            // Thêm ảnh chi tiết mới
            const placeholders = imageDetails.map(() => "(?, ?)").join(", ");
            const values = imageDetails.flatMap((img) => [productId, img]);

            await connection.execute(
                `INSERT INTO imagedetail (productId, imageUrl) VALUES ${placeholders}`,
                values
            );
        }

        res.status(200).json({
            message: "Cập nhật sản phẩm thành công",
            productId,
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        return res.status(500).json({ message: "Lỗi server" });
    } finally {
        if (connection) releaseConnection(connection);
    }
};

export {
    handleGetProduct,
    handleGetProductById,
    handleAddToCart,
    handleGetCart,
    handleDeleteCart,
    handleUpdateCart,
    handleProductAdd,
    handleProductDelete,
    handleProductUpdate,
};
