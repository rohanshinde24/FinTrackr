import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { UserRole } from "../models/User";

/**
 * Middleware to check if the authenticated user is an admin
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): any => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      error: "Admin access required. You do not have permission to access this resource.",
    });
  }

  next();
};

/**
 * Middleware to check if the authenticated user is a super admin
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): any => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      error: "Super admin access required",
    });
  }

  next();
};

