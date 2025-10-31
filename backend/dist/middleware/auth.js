"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireEmailVerification = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({
                success: false,
                error: "Access token required",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, (process.env.JWT_SECRET || "fallback-secret"));
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId },
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "User not found",
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: "Invalid token",
            });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                error: "Token expired",
            });
        }
        return res.status(500).json({
            success: false,
            error: "Authentication failed",
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireEmailVerification = (req, res, next) => {
    if (!req.user?.isEmailVerified) {
        return res.status(403).json({
            success: false,
            error: "Email verification required",
        });
    }
    next();
};
exports.requireEmailVerification = requireEmailVerification;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, (process.env.JWT_SECRET || "fallback-secret"));
            const userRepository = database_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepository.findOne({
                where: { id: decoded.userId },
            });
            req.user = user || undefined;
        }
    }
    catch (error) {
        // Silently fail for optional auth
        req.user = undefined;
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map