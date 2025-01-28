import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { StatusCode } from "../utils/statusCodes";

const prisma = new PrismaClient();

export class blogController {
  static async createBlog(req: Request, res: Response) {
    try {
      const { title, content } = req.body;

      if (!title || !content) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Please enter the required field",
        });
        return;
      }

      const files = req.files as { [fieldName: string]: Express.Multer.File[] };
      const images = files?.images
        ? files.images.map((file) => `/uploads/${file.filename}`)
        : [];

      const blogData: any = {
        title,
        content,
      };

      if (images.length > 0) {
        blogData.images = {
          create: images.map((imageUrl) => ({
            image_url: imageUrl,
          })),
        };
      }

      const newBlog = await prisma.blog.create({
        data: blogData,
      });

      res.status(StatusCode.OK).json({
        status: "success",
        msg: "Successfully created blog",
        blog: {
          id: newBlog.id,
          title,
          content,
        },
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to create blog, please try again later!",
      });
    }
  }

  static async getAllBlogs(req: Request, res: Response) {
    try {
      const blogs = await prisma.blog.findMany({
        include: {
          images: {},
        },
      });
      res.status(StatusCode.OK).json({
        status: "success",
        blogs,
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to get all the blogs, please try again later!",
      });
    }
  }

  static async deleteBlog(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingBlog = await prisma.blog.findUnique({
        where: { id: +id },
      });

      if (!existingBlog) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Unable to find the blog",
        });
        return;
      }

      await prisma.blog_images.deleteMany({
        where: { blog_id: +id },
      });

      await prisma.blog.delete({
        where: {
          id: +id,
        },
      });

      res.status(StatusCode.SUCCESS).json({
        status: "success",
        msg: "Successfully deleted blog",
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to delete the blog, please try again later!",
      });
    }
  }

  static async updateBlog(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingBlog = await prisma.blog.findUnique({
        where: { id: +id },
      });

      if (!existingBlog) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Unable to find the blog",
        });
        return;
      }

      const { title, content } = req.body;

      await prisma.blog.update({
        where: {
          id: +id,
        },
        data: {
          title,
          content,
        },
      });

      res.status(StatusCode.SUCCESS).json({
        status: "success",
        msg: "Successfully updated the blog!",
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to update the blog, please try again later!",
      });
    }
  }
}
