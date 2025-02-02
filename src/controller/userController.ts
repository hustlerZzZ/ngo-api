import bcrypt from "bcrypt";
import jwt, { JwtPayload, VerifyOptions } from "jsonwebtoken";
import { Request, Response } from "express";
import { StatusCode } from "../utils/statusCodes";
import { PrismaClient, user } from "@prisma/client";
import { promisify } from "util";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: any;
}

const signToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_TOKEN_SECRET!);
};

const createToken = (user: user, res: Response) => {
  const token = signToken(`${user.id as number}`);

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: "/",
  });

  res.status(StatusCode.SUCCESS).json({
    status: "success",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image_url: user.user_image,
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
      console.log(e);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to login, please try again later!",
      });
    }
  }

  static async verify(req: Request, res: Response) {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      res.status(401).json({
        status: "failed",
        msg: "You are not logged in! Please log in to get access.",
      });
      return;
    }

    try {
      const verifyAsync = promisify<
        string,
        jwt.Secret,
        VerifyOptions,
        JwtPayload
      >(jwt.verify);

      const decoded = (await verifyAsync(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET!,
        {},
      )) as { id: string };

      const userId = Number(decoded.id);

      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!currentUser) {
        res.status(401).json({
          status: "failed",
          msg: "The user belonging to this token does not exist. Please try again.",
        });
        return;
      }

      (req as any).user = currentUser;

      res.status(200).json({
        status: "success",
        currentUser,
      });
    } catch (err) {
      res.status(401).json({
        status: "failed",
        msg: "Invalid token",
      });
      return;
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

  static async updateUser(req: Request, res: Response) {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "failed",
          msg: "Kindly send all the required fields",
        });
        return;
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!existingUser) {
        res.status(StatusCode.NOT_FOUND).json({
          status: "failed",
          msg: "User not found",
        });
        return;
      }

      await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          name,
          email,
        },
      });

      res.status(StatusCode.OK).json({
        status: "success",
        msg: "Successfully updated",
      });
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to update the user, kindly try again later!",
      });
    }
  }

  static async updatePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "failed",
          msg: "Kindly send all the required fields",
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { password: true },
      });

      if (!user) {
        res.status(StatusCode.NOT_FOUND).json({
          status: "failed",
          msg: "User not found",
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(old_password, user.password);

      if (!isPasswordValid) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "failed",
          msg: "Incorrect old password",
        });
        return;
      }

      const newHashedPass = await bcrypt.hash(new_password, 10);

      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: newHashedPass },
      });

      res.status(StatusCode.OK).json({
        status: "success",
        msg: "Successfully updated the password",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to update the password, kindly try again later!",
      });
      return;
    }
  }

  static async updateAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: +req.user.id },
      });

      if (!user) {
        res.status(StatusCode.BAD_REQUEST).json({
          status: "failed",
          msg: "Unable to find the user!",
        });
      }
    } catch (e) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        msg: "Unable to update the avatar, kindly try again later!",
      });
    }
  }
}
