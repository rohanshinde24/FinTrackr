import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { sendError } from "../http/respond";

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const [scheme, token] = req.headers.authorization?.split(" ") || [];

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return sendError(
        res,
        401,
        "AUTHENTICATION_REQUIRED",
        "A valid bearer token is required"
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not configured");
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & { userId?: string };

    if (!decoded.userId) {
      return sendError(res, 401, "INVALID_TOKEN", "Bearer token is invalid");
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user) {
      return sendError(res, 401, "INVALID_TOKEN", "Bearer token is invalid");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendError(res, 401, "TOKEN_EXPIRED", "Bearer token has expired");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return sendError(res, 401, "INVALID_TOKEN", "Bearer token is invalid");
    }

    return sendError(res, 500, "AUTHENTICATION_FAILED", "Authentication failed");
  }
};

export const requireEmailVerification = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): any => {
  if (!req.user?.isEmailVerified) {
    return sendError(res, 403, "EMAIL_VERIFICATION_REQUIRED", "Email verification required");
  }
  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error("JWT_SECRET is not configured");
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload & { userId?: string };
      if (!decoded.userId) throw new Error("Token subject is missing");
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: decoded.userId },
      });
      req.user = user || undefined;
    }
  } catch (error) {
    // Silently fail for optional auth
    req.user = undefined;
  }
  next();
};
