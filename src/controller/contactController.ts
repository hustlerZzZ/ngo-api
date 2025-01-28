import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { StatusCode } from "../utils/statusCodes";

const prisma = new PrismaClient();

export class contactController {
  static async getAllContactForms(req: Request, res: Response) {
    try {
      const contactForms = await prisma.contact_form.findMany();

      res.status(StatusCode.SUCCESS).json({
        status: "success",
        contactForms,
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to get all the contact form's, please try again later!",
      });
    }
  }

  static async getContactForm(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const contactForm = await prisma.contact_form.findUnique({
        where: {
          id: +id,
        },
      });

      if (!contactForm) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Unable to find the contact form",
        });
        return;
      }

      res.status(StatusCode.SUCCESS).json({
        status: "success",
        contactForm,
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to find the contact form, please try again later!",
      });
    }
  }

  static async createContactForm(req: Request, res: Response) {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !subject || !message) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Please enter the required field",
        });
        return;
      }

      const newContactForm = await prisma.contact_form.create({
        data: {
          name,
          email,
          subject,
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
        msg: "Unable to create the contact form, please try again later!",
      });
    }
  }
}
