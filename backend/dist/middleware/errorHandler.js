"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log error
    console.error("Error:", {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
    });
    // TypeORM errors
    if (err.name === "QueryFailedError") {
        const message = "Database query failed";
        error = { message, status: 400 };
    }
    // Validation errors
    if (err.name === "ValidationError") {
        const message = "Validation failed";
        error = { message, status: 400 };
    }
    // JWT errors
    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token";
        error = { message, status: 401 };
    }
    if (err.name === "TokenExpiredError") {
        const message = "Token expired";
        error = { message, status: 401 };
    }
    res.status(error.status || 500).json({
        success: false,
        error: error.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map