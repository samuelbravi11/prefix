// src/routes/category.routes.js
import express from "express";
import * as categoryController from "../controllers/category.controller.js";

const router = express.Router();

// GET /api/v1/categories
router.get("/", categoryController.listCategories);

export default router;