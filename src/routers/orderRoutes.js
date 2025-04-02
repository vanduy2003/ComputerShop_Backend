import express from "express";
const router = express.Router();
import * as handleOrder from "../app/controllers/OrderController.js";

router.post("/api/v1/data/create-order", handleOrder.handleCreateOrder);
router.get("/api/v1/data/buy-success/:id", handleOrder.handleBuySuccess);
router.get("/api/v1/data/orders", handleOrder.handleGetOrder);
router.put("/api/v1/data/update-status/:id", handleOrder.handleUpdateStatus);
router.delete("/api/v1/data/delete-order/:id", handleOrder.handleDeleteOrder);
router.get("/api/v1/data/list-orders/:id", handleOrder.handleGetOrderByUser);
router.post("/api/v1/data/create-payment", handleOrder.handleCreatePayment);

export default router;
