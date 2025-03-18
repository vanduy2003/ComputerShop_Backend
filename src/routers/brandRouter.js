import express from "express";
const router = express.Router();
import * as handleBrand from "../app/controllers/BrandController.js";

router.get("/api/v1/data/brands", handleBrand.handleGetBrand);

export default router;
