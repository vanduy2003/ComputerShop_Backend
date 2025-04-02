import { getConnection, releaseConnection } from "../../config/db/index.js";
import crypto from "crypto"; // ✅ Thêm import cho crypto
import axios from "axios"; // ✅ Thêm import cho axios

// POST: /api/v1/data/create-order
const handleCreateOrder = async (req, res) => {
    const {
        userId,
        receiverName,
        phoneNumber,
        email,
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
            `INSERT INTO orders (userId, receiver_name, phone_number, email, province, district, ward, address, total_price, payment_method, countItems, order_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                receiverName,
                phoneNumber,
                email,
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

// GET: /api/v1/data/buy-success/:id
const handleBuySuccess = async (req, res) => {
    const orderId = req.params.id; // ✅ Lấy orderId từ URL chính xác

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

// GET: /api/v1/data/order
const handleGetOrder = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        // 1️⃣ Truy vấn lấy danh sách đơn hàng
        const [orderResults] = await connection.execute(`SELECT 
                o.*, 
                GROUP_CONCAT(od.product_name SEPARATOR ', ') AS product_names
            FROM orders o
            LEFT JOIN order_details od ON o.orderId = od.orderId
            GROUP BY o.orderId
            ORDER BY o.created_at DESC`);

        // 2️⃣ Trả về dữ liệu đơn hàng
        res.json({ success: true, orders: orderResults });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách đơn hàng",
            error: error.message,
        });
    } finally {
        releaseConnection(connection); // ✅ Giải phóng kết nối
    }
};

// PUT: /api/v1/data/update-status/:id
const handleUpdateStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (
        ![
            "pending",
            "confirmed",
            "completed",
            "cancelled",
            "shiping",
            "shiped",
        ].includes(status)
    ) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    let connection;
    try {
        connection = await getConnection();

        // 1️⃣ Cập nhật trạng thái đơn hàng
        const [result] = await connection.execute(
            `UPDATE orders SET order_status = ? WHERE orderId = ?`,
            [status, orderId]
        );

        if (result.affectedRows > 0) {
            return res.json({
                success: true,
                message: "Cập nhật trạng thái đơn hàng thành công!",
            });
        } else {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy đơn hàng!" });
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật trạng thái đơn hàng",
            error: error.message,
        });
    } finally {
        releaseConnection(connection);
    }
};

// DELETE: /api/v1/data/delete-order/:id
const handleDeleteOrder = async (req, res) => {
    const orderId = req.params.id;

    if (!orderId) {
        return res.status(400).json({ message: "Thiếu orderId!" });
    }

    let connection;
    try {
        connection = await getConnection();

        // 1️⃣ Xóa đơn hàng
        const [result] = await connection.execute(
            `DELETE FROM orders WHERE orderId = ?`,
            [orderId]
        );

        if (result.affectedRows > 0) {
            return res.json({
                success: true,
                message: "Xóa đơn hàng thành công!",
            });
        } else {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy đơn hàng!" });
        }
    } catch (error) {
        console.error("Lỗi khi xóa đơn hàng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi xóa đơn hàng",
            error: error.message,
        });
    } finally {
        releaseConnection(connection);
    }
};

// GET: /api/v1/data/order/:id
const handleGetOrderByUser = async (req, res) => {
    const userId = req.params.id; // ✅ Lấy userId từ URL

    if (!userId) {
        return res
            .status(400)
            .json({ success: false, message: "Thiếu userId!" });
    }

    let connection;
    try {
        connection = await getConnection();

        // 1️⃣ Truy vấn danh sách đơn hàng của user
        const [orders] = await connection.execute(
            `SELECT * FROM orders WHERE userId = ? ORDER BY created_at DESC`,
            [userId]
        );

        if (orders.length === 0) {
            return res.json({
                success: true,
                message: "Người dùng chưa có đơn hàng nào.",
                orders: [],
            });
        }

        // 2️⃣ Truy vấn chi tiết sản phẩm của từng đơn hàng
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const [orderDetails] = await connection.execute(
                    `SELECT od.productId, od.product_name, od.price, od.quantity, od.subtotal, 
                            p.imageUrl AS product_image, p.highlightType
                     FROM order_details od
                     JOIN products p ON od.productId = p.productId  
                     WHERE od.orderId = ?`,
                    [order.orderId]
                );

                return {
                    ...order,
                    cartItems: orderDetails, // ✅ Danh sách sản phẩm có thêm ảnh
                };
            })
        );

        // 3️⃣ Trả về danh sách đơn hàng kèm sản phẩm
        res.json({
            success: true,
            orders: ordersWithDetails,
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách đơn hàng",
            error: error.message,
        });
    } finally {
        releaseConnection(connection); // ✅ Giải phóng kết nối
    }
};

// POST: /api/v1/data/create-payment
const handleCreatePayment = async (req, res) => {
    try {
        console.log("Dữ liệu nhận từ frontend:", req.body); // Debug

        const { orderId, amount } = req.body;
        if (!orderId || !amount) {
            return res.status(400).json({ error: "Thiếu orderId hoặc amount" });
        }

        const partnerCode = "MOMO";
        const accessKey = "F8BBA842ECF85";
        const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
        const requestId = partnerCode + new Date().getTime();
        const momoOrderId = `ORDER_${orderId}_${Date.now()}`; // ✅ Tạo orderId duy nhất
        const orderInfo = "Thanh toán đơn hàng";
        const redirectUrl =
            "http://localhost:8080/me/cart/buy-success/" + orderId; // Đường dẫn sau khi thanh toán thành công
        const ipnUrl = "https://your-backend.com/api/v1/payment/momo-ipn"; // Webhook nhận phản hồi từ MoMo
        const requestType = "captureWallet";
        const extraData = "";

        // 🔐 Tạo chữ ký
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = crypto
            .createHmac("sha256", secretKey)
            .update(rawSignature)
            .digest("hex");

        // 📡 Gửi request tới MoMo
        const requestBody = {
            partnerCode,
            accessKey,
            requestId,
            amount,
            orderId: momoOrderId, // ✅ Sử dụng orderId duy nhất
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            signature,
            lang: "vi",
        };

        const response = await axios.post(
            "https://test-payment.momo.vn/v2/gateway/api/create",
            requestBody,
            { headers: { "Content-Type": "application/json" } }
        );

        console.log("Kết quả từ MoMo:", response.data); // Debug

        res.json(response.data);
    } catch (error) {
        console.error(
            "Lỗi MoMo:",
            error.response ? error.response.data : error
        );
        res.status(500).json({ error: error.message });
    }
};

// POST: /api/v1/payment/momo-ipn
const handleMoMoIPN = async (req, res) => {
    try {
        console.log("📢 Nhận dữ liệu từ MoMo IPN:", req.body);

        const {
            orderId, // Đây là `momoOrderId` (ORDER_{orderId}_{timestamp})
            requestId,
            amount,
            resultCode,
            message,
        } = req.body;

        if (!orderId || !resultCode) {
            return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
        }

        const connection = await getConnection();

        // ✅ Nếu giao dịch thành công (resultCode === 0)
        if (resultCode === 0) {
            // Trích xuất orderId gốc từ momoOrderId (ORDER_{orderId}_{timestamp})
            const originalOrderId = orderId.split("_")[1];

            // Cập nhật trạng thái đơn hàng
            await connection.execute(
                `UPDATE orders SET payment_status = ? WHERE orderId = ?`,
                ["paid", originalOrderId]
            );

            console.log(
                `✅ Đã cập nhật trạng thái thanh toán cho đơn hàng ${originalOrderId}`
            );
        } else {
            console.log(`❌ Thanh toán thất bại: ${message}`);
        }

        releaseConnection(connection);
        res.json({ success: true });
    } catch (error) {
        console.error("Lỗi xử lý IPN MoMo:", error);
        res.status(500).json({ error: error.message });
    }
};

export {
    handleCreateOrder,
    handleBuySuccess,
    handleGetOrder,
    handleUpdateStatus,
    handleDeleteOrder,
    handleGetOrderByUser,
    handleCreatePayment,
    handleMoMoIPN,
};
