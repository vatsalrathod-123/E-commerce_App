import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import { getProfile } from "../controllers/profileController.js";
import authUser from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", adminLogin);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/profile", authUser, getProfile);

export default userRouter;
