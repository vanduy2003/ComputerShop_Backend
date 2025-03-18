import express from "express";
const router = express.Router();
import * as handleCategori from "../app/controllers/CategoryController.js";

router.get("/api/v1/data/category", handleCategori.handleGetCategory);
router.get("/api/v1/data/suppliers", handleCategori.handleGetSuppliers);
router.get("/api/v1/data/brands", handleCategori.handleGetBrands);
router.get("/api/v1/data/components", handleCategori.handleGetComponents);

export default router;
