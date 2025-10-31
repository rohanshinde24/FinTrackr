"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const userRepository = database_1.AppDataSource.getRepository(User_1.User);
// Validation middleware
const validateRegistration = [
    (0, express_validator_1.body)("email").isEmail().normalizeEmail(),
    (0, express_validator_1.body)("password").isLength({ min: 8 }),
    (0, express_validator_1.body)("firstName").trim().notEmpty(),
    (0, express_validator_1.body)("lastName").trim().notEmpty(),
];
const validateLogin = [
    (0, express_validator_1.body)("email").isEmail().normalizeEmail(),
    (0, express_validator_1.body)("password").notEmpty(),
];
// Register new user
router.post("/register", validateRegistration, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
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
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
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
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            error: "Registration failed",
        });
    }
});
// Login user
router.post("/login", validateLogin, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
        }
        // Generate JWT token
        // @ts-ignore - TypeScript has issues with jwt.sign overloads
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
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
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            error: "Login failed",
        });
    }
});
// Get user profile
router.get("/profile", auth_1.authenticateToken, async (req, res) => {
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
    }
    catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch profile",
        });
    }
});
// Refresh token
router.post("/refresh", auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        // Generate new token
        // @ts-ignore - TypeScript has issues with jwt.sign overloads
        const token = jsonwebtoken_1.default.sign({ userId: req.user.id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
        res.json({
            success: true,
            data: { token },
        });
    }
    catch (error) {
        console.error("Token refresh error:", error);
        res.status(500).json({
            success: false,
            error: "Token refresh failed",
        });
    }
});
// Logout (client-side token removal)
router.post("/logout", (req, res) => {
    res.json({
        success: true,
        message: "Logout successful",
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map