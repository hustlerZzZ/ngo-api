import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { StatusCode } from "../utils/statusCodes";
import { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();

export class authController {
  static async protect(req: Request, res: Response, next: NextFunction) {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(StatusCode.FAILED).json({
        status: "failed",
        msg: "You are not logged in! Please log in to get access.",
      });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET!,
      ) as JwtPayload;

      if (!decoded.id) {
        res.status(StatusCode.FAILED).json({
          status: "failed",
          msg: "Token error! Please try again.",
        });
        return;
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: +decoded.id },
      });

      if (!currentUser) {
        res.status(StatusCode.FAILED).json({
          status: "failed",
          msg: "The user belonging to this token does not exist. Please try again.",
        });
        return;
      }

      (req as any).user = currentUser;
      next();
    } catch (err) {
      res.status(StatusCode.FAILED).json({
        status: "failed",
        msg: "Invalid token",
      });
      return;
    }
  }
}
