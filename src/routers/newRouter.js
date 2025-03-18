import express from "express";
const router = express.Router();
import * as hendleNew from "../app/controllers/NewController.js";

router.get("/api/v1/data/news", hendleNew.handleGetNews);
router.get("/api/v1/data/news/:id", hendleNew.handleGetNewById);

export default router;
