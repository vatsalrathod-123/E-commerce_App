import express from "express";
import rateLimit from "express-rate-limit";
import { chatWithAssistant } from "../controllers/chatController.js";

const chatRouter = express.Router();

// Protect your free quota: 15 requests per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many requests, slow down." },
});

chatRouter.post("/", chatLimiter, chatWithAssistant);

export default chatRouter;
