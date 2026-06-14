import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        message: "No token provided",
      });

      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
    });
  }
};
