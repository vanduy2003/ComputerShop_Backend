import express from "express";
const router = express.Router();
import * as hendleNew from "../app/controllers/NewController.js";

router.get("/api/v1/data/news", hendleNew.handleGetNews);
router.get("/api/v1/data/news/:id", hendleNew.handleGetNewById);
router.post("/api/v1/data/news/add-new", hendleNew.handleAddNew);
router.put("/api/v1/data/news/:id", hendleNew.handleUpdateNew);
router.delete("/api/v1/data/news-delete/:id", hendleNew.handleDeleteNew);

export default router;
