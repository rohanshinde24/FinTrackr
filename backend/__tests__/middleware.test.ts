import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Mock auth middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "test-secret");
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Mock error handler middleware
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

describe("Middleware Tests", () => {
  describe("Auth Middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        headers: {},
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
    });

    it("should pass with valid token", () => {
      const token = jwt.sign(
        { id: 1, email: "test@example.com" },
        process.env.JWT_SECRET || "test-secret"
      );

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toBeDefined();
    });

    it("should fail without token", () => {
      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Authentication required",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should fail with invalid token", () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };

      authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid or expired token",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should fail with expired token", () => {
      const expiredToken = jwt.sign(
        { id: 1, email: "test@example.com" },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "0s" }
      );

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      // Wait a bit to ensure token is expired
      setTimeout(() => {
        authMiddleware(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(nextFunction).not.toHaveBeenCalled();
      }, 100);
    });
  });

  describe("Error Handler Middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {};
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
    });

    it("should handle errors with status code", () => {
      const error = {
        statusCode: 400,
        message: "Bad request",
      };

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Bad request",
        stack: undefined,
      });
    });

    it("should default to 500 for errors without status code", () => {
      const error = new Error("Unexpected error");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it("should include stack trace in development mode", () => {
      process.env.NODE_ENV = "development";
      const error = new Error("Test error");

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Test error",
        stack: error.stack,
      });
    });
  });
});

