import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../models/User";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { sendError } from "../http/respond";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

const publicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  defaultCurrency: user.defaultCurrency,
  createdAt: user.createdAt,
});

const signAccessToken = (user: User): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
  return jwt.sign({ userId: user.id }, secret, { expiresIn });
};

// Validation middleware
const validateRegistration = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8, max: 128 }),
  body("firstName").trim().notEmpty().isLength({ max: 80 }),
  body("lastName").trim().notEmpty().isLength({ max: 80 }),
];

const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty().isLength({ max: 128 }),
];

// Register new user
router.post(
  "/register",
  validateRegistration,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "Request validation failed",
          errors.array()
        );
      }

      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        return sendError(res, 409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = userRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      await userRepository.save(user);

      const token = signAccessToken(user);

      res.status(201).json({
        success: true,
        data: {
          user: publicUser(user),
          token,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      return sendError(res, 500, "REGISTRATION_FAILED", "Registration failed");
    }
  }
);

// Login user
router.post("/login", validateLogin, async (req: Request, res: Response): Promise<any> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Request validation failed",
        errors.array()
      );
    }

    const { email, password } = req.body;

    // Find user
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const token = signAccessToken(user);

    res.json({
      success: true,
      data: {
        user: publicUser(user),
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, 500, "LOGIN_FAILED", "Login failed");
  }
});

// Get user profile
router.get(
  "/profile",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      if (!req.user) {
        return sendError(
          res,
          401,
          "AUTHENTICATION_REQUIRED",
          "A valid bearer token is required"
        );
      }

      res.json({
        success: true,
        data: {
          user: publicUser(req.user),
        },
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      return sendError(res, 500, "PROFILE_FETCH_FAILED", "Failed to fetch profile");
    }
  }
);

// Refresh token
router.post(
  "/refresh",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      if (!req.user) {
        return sendError(
          res,
          401,
          "AUTHENTICATION_REQUIRED",
          "A valid bearer token is required"
        );
      }

      const token = signAccessToken(req.user);

      res.json({
        success: true,
        data: { token },
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      return sendError(res, 500, "TOKEN_REFRESH_FAILED", "Token refresh failed");
    }
  }
);

// Logout (client-side token removal)
router.post("/logout", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Logout successful",
  });
});

/**
 * Admin Login - Separate endpoint for admin authentication
 * Only allows users with ADMIN or SUPER_ADMIN role to login
 */
router.post(
  "/admin/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req: Request, res: Response): Promise<any> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "Request validation failed",
          errors.array()
        );
      }

      const { email, password } = req.body;

      // Find user
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        return sendError(
          res,
          401,
          "INVALID_CREDENTIALS",
          "Invalid email or password"
        );
      }

      // Check if user has admin role
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
        return sendError(res, 403, "ADMIN_ACCESS_REQUIRED", "Admin access is required");
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return sendError(
          res,
          401,
          "INVALID_CREDENTIALS",
          "Invalid email or password"
        );
      }

      const token = signAccessToken(user);

      res.json({
        success: true,
        message: "Admin login successful",
        data: {
          user: publicUser(user),
          token,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return sendError(res, 500, "ADMIN_LOGIN_FAILED", "Admin login failed");
    }
  }
);

export default router;
