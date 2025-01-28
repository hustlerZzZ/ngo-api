import express from "express";
const router = express.Router();
import upload from "../middleware/upload";
import { authController } from "../controller/authController";
import { storyController } from "../controller/storyController";

router.post(
  "/create",
  authController.protect,
  upload,
  storyController.createStory,
);

router.get("/get-all-stories", storyController.getAllStory);

router.delete(
  "/delete-story/:id",
  authController.protect,
  storyController.deleteStory,
);

export default router;
