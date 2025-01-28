import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { StatusCode } from "../utils/statusCodes";
import { PrismaClient, user } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: any;
}

const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_TOKEN_SECRET!);
};

const createToken = (user: user, res: Response) => {
  const token = signToken(`${user.id as number}`);
  const cookieOptions = {
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOptions);

  res.status(StatusCode.OK).json({
    status: "success",
    user: {
      id: user.id,
      email: user.email,
    },
  });
};

export class userController {
  static async userRegistration(req: Request, res: Response) {
    try {
      const { name, email, password, password_confirmation } = req.body;
      if (!name || !email || !password || !password_confirmation) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Please enter the required field",
        });
        return;
      }

      if (password !== password_confirmation) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Passwords do not match",
        });
        return;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(StatusCode.ALREADY_EXISTS).json({
          status: "failed",
          msg: "Email already exists!",
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      res.status(StatusCode.OK).json({
        status: "success",
        msg: "Registration success!",
        newUser: {
          id: newUser.id,
          email: newUser.email,
          created_at: newUser.created_at,
        },
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to register, please try again later!",
      });
    }
  }

  static async userLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(StatusCode.FAILED).json({
          status: "failed",
          msg: "User not found!",
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        res.status(StatusCode.FAILED).json({
          status: "failed",
          msg: "Invalid email or password!",
        });
        return;
      }

      createToken(user, res);
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to login, please try again later!",
      });
    }
  }

  static async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        res.status(StatusCode.NOT_FOUND).json({
          status: "failed",
          msg: "User not found",
        });
        return;
      }

      const files = req.files as { [fieldName: string]: Express.Multer.File[] };

      const avatarFile = files.avatar;

      if (!avatarFile || avatarFile.length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "error",
          msg: "Avatar is required",
        });
        return;
      }

      const file = avatarFile[0];
      const image_url = `/uploads/${file.filename}`;

      if (file) {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            user_image: image_url,
          },
        });

        res.status(StatusCode.OK).json({
          status: "success",
          user,
        });
      } else {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "failed",
          msg: "No file uploaded",
        });
      }
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to upload the avatar, please try again later!",
      });
    }
  }

  static async removeAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        res.status(StatusCode.NOT_FOUND).json({
          status: "failed",
          msg: "User not found",
        });
        return;
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          user_image: undefined,
        },
      });

      res.status(StatusCode.OK).json({
        status: "success",
        user,
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to remove the avatar, please try again later!",
      });
    }
  }
}
