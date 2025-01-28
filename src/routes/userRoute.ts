import express from "express";
const router = express.Router();
import { userController } from "../controller/userController";

router.get("/sign-in", userController.userLogin);
router.post("/register", userController.userRegistration);

export default router;
