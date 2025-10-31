import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
export interface AuthRequest extends Request {
    user?: User;
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>;
export declare const requireEmailVerification: (req: AuthRequest, res: Response, next: NextFunction) => any;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>;
