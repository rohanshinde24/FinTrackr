import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../models/User";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Validation middleware
const validateRegistration = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  body("firstName").trim().notEmpty(),
  body("lastName").trim().notEmpty(),
];

const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

// Register new user
router.post(
  "/register",
  validateRegistration,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "User with this email already exists",
        });
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

      // Generate JWT token
      // @ts-ignore - TypeScript has issues with jwt.sign overloads
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: "Registration failed",
      });
    }
  }
);

// Login user
router.post("/login", validateLogin, async (req: Request, res: Response): Promise<any> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate JWT token
    // @ts-ignore - TypeScript has issues with jwt.sign overloads
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

// Get user profile
router.get(
  "/profile",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const { password: _, ...userWithoutPassword } = req.user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
        },
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch profile",
      });
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
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      // Generate new token
      // @ts-ignore - TypeScript has issues with jwt.sign overloads
      const token = jwt.sign(
        { userId: req.user.id },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      res.json({
        success: true,
        data: { token },
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({
        success: false,
        error: "Token refresh failed",
      });
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
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid admin credentials",
        });
      }

      // Check if user has admin role
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          error: "Admin access denied. This login is only for administrators.",
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: "Invalid admin credentials",
        });
      }

      // Generate JWT token
      // @ts-ignore - TypeScript has issues with jwt.sign overloads
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: "Admin login successful",
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({
        success: false,
        error: "Admin login failed",
      });
    }
  }
);

export default router;
