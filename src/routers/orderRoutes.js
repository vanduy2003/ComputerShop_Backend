import express from "express";
const router = express.Router();
import * as handleOrder from "../app/controllers/OrderController.js";

router.post("/api/v1/data/create-order", handleOrder.handleCreateOrder);
router.get("/api/v1/data/buy-success/:id", handleOrder.handleBuySuccess);

export default router;
