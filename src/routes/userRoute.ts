import express from "express";
const router = express.Router();
import upload from "../middleware/upload";
import { userController } from "../controller/userController";
import { authController } from "../controller/authController";

router.get("/sign-in", userController.userLogin);
router.post("/register", userController.userRegistration);
router.post(
  "/upload-avatar",
  authController.protect,
  upload,
  userController.uploadAvatar,
);
router.delete(
  "/delete-avatar",
  authController.protect,
  userController.removeAvatar,
);

export default router;
