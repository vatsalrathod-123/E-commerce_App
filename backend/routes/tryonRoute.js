import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { getTryOnStatus, tryOn } from "../controllers/tryonController.js";

const tryonRouter = express.Router();

// Photos are kept in memory only (never saved to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Free tier quota protection: 5 try-ons per minute per IP
const tryonLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many try-ons, please wait a minute.",
  },
});

tryonRouter.get("/status", getTryOnStatus);
tryonRouter.post("/", tryonLimiter, upload.single("photo"), tryOn);

export default tryonRouter;
