import { NextFunction, Response, Router } from "express";
import { query } from "express-validator";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { sendValidationErrors } from "../middleware/requestValidation";
import { getDashboardOverview } from "../services/dashboardService";

const router = Router();
const monthPattern = /^[0-9]{4}-(0[1-9]|1[0-2])$/;

router.use(authenticateToken);

router.get(
  "/overview",
  query("month").optional().isString().matches(monthPattern),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const data = await getDashboardOverview(
        req.user!.id,
        req.query.month as string | undefined
      );
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
