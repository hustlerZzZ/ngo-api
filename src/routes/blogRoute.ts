import express from "express";
const router = express.Router();
import upload from "../middleware/upload";
import { authController } from "../controller/authController";
import { blogController } from "../controller/blogController";

router.post(
  "/create",
  authController.protect,
  upload,
  blogController.createBlog,
);

router.get("/get-all-blogs", blogController.getAllBlogs);

router.delete(
  "/delete-blog/:id",
  authController.protect,
  blogController.deleteBlog,
);

router.patch(
  "update-blog/:id",
  authController.protect,
  blogController.updateBlog,
);

export default router;
