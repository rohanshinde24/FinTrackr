import { Request, Response, NextFunction } from "express";
export interface AppError extends Error {
    status?: number;
    isOperational?: boolean;
}
export declare const errorHandler: (err: AppError, req: Request, res: Response, next: NextFunction) => void;
