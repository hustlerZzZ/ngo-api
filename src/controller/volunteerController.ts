import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { StatusCode } from "../utils/statusCodes";

const prisma = new PrismaClient();

export class volunteerController {
  static async createVolunteerForm(req: Request, res: Response) {
    try {
      const {
        name,
        email,
        phone_number,
        address,
        state,
        country,
        zip_code,
        message,
      } = req.body;

      if (
        !name ||
        !email ||
        !phone_number ||
        !address ||
        !state ||
        !country ||
        !zip_code ||
        !message
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Please enter the required field",
        });
        return;
      }

      const newContactForm = await prisma.volunteer_form.create({
        data: {
          name,
          email,
          phone_number,
          address,
          state,
          country,
          zip_code,
          message,
        },
      });

      res.status(StatusCode.SUCCESS).json({
        status: "success",
        contactForm: newContactForm,
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to create the volunteer form, please try again later!",
      });
    }
  }

  static async getAllVolunteerForm(req: Request, res: Response) {
    try {
      const allVolunteerForms = await prisma.volunteer_form.findMany();
      res.status(StatusCode.OK).json({
        status: "success",
        allVolunteerForms,
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to get all the volunteer form's, please try again later!",
      });
    }
  }

  static async getVolunteerForm(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingVolunteerForm = await prisma.volunteer_form.findUnique({
        where: { id: +id },
      });

      if (!existingVolunteerForm) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Unable to find the volunteer form, please try again later!",
        });
        return;
      }

      res.status(StatusCode.OK).json({
        status: "success",
        existingVolunteerForm,
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to get the volunteer form, please try again later!",
      });
    }
  }
}
