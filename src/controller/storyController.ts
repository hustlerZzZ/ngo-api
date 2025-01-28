import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { StatusCode } from "../utils/statusCodes";

const prisma = new PrismaClient();

export class storyController {
  static async createStory(req: Request, res: Response) {
    try {
      const { title, page_url } = req.body;

      if (!title || !page_url) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Please enter the required field",
        });
        return;
      }

      const files = req.files as { [fieldName: string]: Express.Multer.File[] };

      const storyFiles = files.story;

      if (!storyFiles || storyFiles.length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Story image is required",
        });
        return;
      }

      const file = storyFiles[0];

      if (!file) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Image is required",
        });
        return;
      }

      const image_url = `/uploads/${file.filename}`;

      const newStory = await prisma.story.create({
        data: {
          title,
          page_url,
          story_images: {
            create: {
              image_url: image_url,
            },
          },
        },
        include: {
          story_images: true,
        },
      });

      res.status(StatusCode.OK).json({
        status: "success",
        msg: "Successfully created blog",
        blog: {
          id: newStory.id,
          title,
          page_url,
          image_url: newStory.story_images.map((img) => img.image_url),
        },
      });
    } catch (e) {
      console.log(e);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to create story, please try again later!",
      });
    }
  }

  static async getAllStory(req: Request, res: Response) {
    try {
      const stories = await prisma.story.findMany({
        include: {
          story_images: {},
        },
      });
      res.status(StatusCode.OK).json({
        status: "success",
        stories,
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to get all the stories, please try again later!",
      });
    }
  }

  static async deleteStory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingStory = await prisma.story.findUnique({
        where: { id: +id },
      });

      if (!existingStory) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Unable to find the blog",
        });
        return;
      }

      await prisma.story_images.deleteMany({
        where: { story_id: +id },
      });

      await prisma.story.delete({
        where: {
          id: +id,
        },
      });

      res.status(StatusCode.SUCCESS).json({
        status: "success",
        msg: "Successfully deleted story",
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to delete the story, please try again later!",
      });
    }
  }
}
