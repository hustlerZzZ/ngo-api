import { promisify } from "util";
import { StatusCode } from "../utils/statusCodes";
import { PrismaClient, user } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import jwt, { VerifyOptions } from "jsonwebtoken";

const prisma = new PrismaClient();

export class authController {
  static async protect(req: Request, res: Response, next: NextFunction) {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(StatusCode.FAILED).json({
        status: "failed",
        msg: "You are not logged in! Please log in to get access.",
      });
      return;
    }

    const verifyAsync = promisify<
      string,
      jwt.Secret,
      VerifyOptions,
      jwt.JwtPayload
    >(jwt.verify);

    let decoded: { id: string } | undefined;
    try {
      decoded = (await verifyAsync(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET!,
        {},
      )) as {
        id: string;
      };
    } catch (err) {
      res.status(StatusCode.FAILED).json({
        status: "failed",
        msg: "Invalid token",
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
    }

    (req as any).user = currentUser;

    next();
  }
}
