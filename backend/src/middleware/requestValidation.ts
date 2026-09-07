import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { sendError } from "../http/respond";

export const rejectUnknownFields = (allowedFields: string[]) =>
  body().custom((value) => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).some((field) => !allowedFields.includes(field))
    ) {
      throw new Error("Request body contains unsupported fields");
    }
    return true;
  });

export const requireNonEmptyBody = () =>
  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error("Request body must contain at least one field");
    }
    return true;
  });

export const sendValidationErrors = (
  req: Request,
  res: Response
): Response | undefined => {
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
  return undefined;
};
