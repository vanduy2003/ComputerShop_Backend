import express from "express";
const router = express.Router();
import * as hendleProduct from "../app/controllers/ProductController.js";

router.get("/api/v1/data/products", hendleProduct.handleGetProduct);
router.get("/api/v1/data/products/:id", hendleProduct.handleGetProductById);
router.post("/api/v1/data/add-cart", hendleProduct.handleAddToCart);
router.get("/api/v1/data/get-cart/:id", hendleProduct.handleGetCart);
router.delete("/api/v1/data/delete-cart/:id", hendleProduct.handleDeleteCart);
router.put("/api/v1/data/update-cart", hendleProduct.handleUpdateCart);
router.post("/api/v1/data/product-add", hendleProduct.handleProductAdd);
router.delete(
    "/api/v1/data/product-delete/:id",
    hendleProduct.handleProductDelete
);
router.put("/api/v1/data/product-update", hendleProduct.handleProductUpdate);

export default router;
