import { Response } from "express";

export const sendError = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response =>
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      requestId: res.locals.requestId,
      ...(details === undefined ? {} : { details }),
    },
  });
