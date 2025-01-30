import express from "express";
const router = express.Router();
import upload from "../middleware/upload";
import { userController } from "../controller/userController";
import { authController } from "../controller/authController";

router.post("/sign-in", userController.userLogin);
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
router.get("/verify-token", userController.verify);
router.put("/update-me", authController.protect, userController.updateUser);
router.put(
  "/update-password",
  authController.protect,
  userController.updatePassword,
);
router.put(
  "update-avatar",
  authController.protect,
  userController.updateAvatar,
);

export default router;
