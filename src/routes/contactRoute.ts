import express from "express";
const router = express.Router();
import { authController } from "../controller/authController";
import { contactController } from "../controller/contactController";

router.get(
  "/get-all-contact-forms",
  authController.protect,
  contactController.getAllContactForms,
);

router.get(
  "/get-contact-from/:id",
  authController.protect,
  contactController.getContactForm,
);

router.post("/create-contact-form", contactController.createContactForm);

export default router;
