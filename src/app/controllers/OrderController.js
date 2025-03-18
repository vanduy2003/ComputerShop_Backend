import { getConnection, releaseConnection } from "../../config/db/index.js";

const handleCreateOrder = async (req, res) => {
    const {
        userId,
        receiverName,
        phoneNumber,
        provinceName,
        districtName,
        wardName,
        detailAddress,
        total,
        countItems,
        paymentMethod,
        cartItems,
    } = req.body;

    if (!cartItems || cartItems.length === 0) {
        return res
            .status(400)
            .json({ success: false, message: "Giỏ hàng trống!" });
    }

    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // 1️⃣ Thêm đơn hàng vào bảng orders
        const [orderResult] = await connection.execute(
            `INSERT INTO orders (userId, receiver_name, phone_number, province, district, ward, address, total_price, payment_method, countItems, order_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                receiverName,
                phoneNumber,
                provinceName,
                districtName,
                wardName,
                detailAddress,
                total,
                paymentMethod,
                countItems,
                "pending",
            ]
        );

        const orderId = orderResult.insertId; // Lấy ID của đơn hàng vừa tạo

        // 2️⃣ Thêm từng sản phẩm vào order_details
        const orderDetailsQuery = `INSERT INTO order_details (orderId, productId, product_name, price, quantity, subtotal) VALUES ?`;
        const orderDetailsData = cartItems.map((item) => [
            orderId,
            item.productId,
            item.name,
            item.priceNew,
            item.quantity,
            item.priceNew * item.quantity,
        ]);

        await connection.query(orderDetailsQuery, [orderDetailsData]);

        // 3️⃣ Xóa giỏ hàng sau khi đặt hàng thành công
        await connection.execute(`DELETE FROM cart WHERE userId = ?`, [userId]);

        await connection.commit();
        res.json({ success: true, message: "Đặt hàng thành công!", orderId });
    } catch (error) {
        if (connection) {
            await connection.rollback(); // 🔴 Rollback nếu có lỗi
        }
        console.error("Lỗi khi đặt hàng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi đặt hàng",
            error: error.message,
        });
    } finally {
        releaseConnection(connection); // ✅ Giải phóng kết nối
    }
};

const handleBuySuccess = async (req, res) => {
    const orderId = req.params.id; // ✅ Lấy orderId từ URL chính xác
    console.log("🖥️ Server nhận orderId:", orderId); // 📌 Kiểm tra log trên server

    if (!orderId) {
        return res
            .status(400)
            .json({ success: false, message: "Thiếu orderId!" });
    }

    let connection;
    try {
        connection = await getConnection();

        // 1️⃣ Truy vấn lấy thông tin đơn hàng
        const [orderResult] = await connection.execute(
            `SELECT * FROM orders WHERE orderId = ?`,
            [orderId]
        );

        if (orderResult.length === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy đơn hàng!" });
        }

        const order = orderResult[0]; // Lấy thông tin đơn hàng

        // 2️⃣ Truy vấn lấy danh sách sản phẩm trong đơn hàng + ảnh từ bảng products
        const [orderDetails] = await connection.execute(
            `SELECT od.productId, od.product_name, od.price, od.quantity, od.subtotal, 
                    p.imageUrl AS product_image  -- ✅ Lấy ảnh từ bảng products
             FROM order_details od
             JOIN products p ON od.productId = p.productId  -- ✅ Kết hợp với bảng products
             WHERE od.orderId = ?`,
            [orderId]
        );

        // 3️⃣ Trả về dữ liệu đơn hàng và sản phẩm
        res.json({
            success: true,
            order: {
                ...order,
                cartItems: orderDetails, // ✅ Danh sách sản phẩm có thêm ảnh
            },
        });
    } catch (error) {
        console.error("Lỗi khi lấy đơn hàng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy đơn hàng",
            error: error.message,
        });
    } finally {
        releaseConnection(connection); // ✅ Giải phóng kết nối
    }
};

export { handleCreateOrder, handleBuySuccess };
