import express from "express";
import { volunteerController } from "../controller/volunteerController";
import { authController } from "../controller/authController";
const router = express.Router();

router.post("/create-volunteer-form", volunteerController.createVolunteerForm);
router.get(
  "/get-all-volunteer-forms",
  authController.protect,
  volunteerController.getAllVolunteerForm,
);
router.get(
  "/get-volunteer-form/:id",
  authController.protect,
  volunteerController.getVolunteerForm,
);

export default router;
