import express from "express";
const router = express.Router();
import * as handleCategori from "../app/controllers/CategoryController.js";

router.get("/api/v1/data/category", handleCategori.handleGetCategory);
router.get("/api/v1/data/suppliers", handleCategori.handleGetSuppliers);
router.get("/api/v1/data/brands", handleCategori.handleGetBrands);
router.get("/api/v1/data/components", handleCategori.handleGetComponents);

// Add new category
router.post(
    "/api/v1/data/category/add-category",
    handleCategori.handleAddCategory
);

// Update category
router.put(
    "/api/v1/data/category/update-category/:id",
    handleCategori.handleUpdateCategory
);

// Delete category
router.delete(
    "/api/v1/data/category/delete-category/:id",
    handleCategori.handleDeleteCategory
);

// Add supplier
router.post(
    "/api/v1/data/suppliers/add-supplier",
    handleCategori.handleAddSupplier
);

// Update supplier
router.put(
    "/api/v1/data/suppliers/update-supplier/:id",
    handleCategori.handleUpdateSupplier
);

// Delete supplier
router.delete(
    "/api/v1/data/suppliers/delete-supplier/:id",
    handleCategori.handleDeleteSupplier
);

export default router;
