import express from "express";
import * as assetController from "../controllers/asset.controller.js";

const router = express.Router();

router.get("/", assetController.listAssets);
router.post("/", assetController.createAsset);
router.put("/:id", assetController.updateAsset);
router.delete("/:id", assetController.deleteAsset);

export default router;
