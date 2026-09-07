import { NextFunction, Response, Router } from "express";
import { body, param, query } from "express-validator";
import { sendError } from "../http/respond";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  rejectUnknownFields,
  requireNonEmptyBody,
  sendValidationErrors,
} from "../middleware/requestValidation";
import {
  BudgetServiceError,
  createBudget,
  deleteBudget,
  listBudgets,
  updateBudget,
} from "../services/budgetService";

const router = Router();

const positiveAmount = /^(?=.*[1-9])[0-9]{1,13}(\.[0-9]{1,2})?$/;
const monthPattern = /^[0-9]{4}-(0[1-9]|1[0-2])$/;
const createFields = ["categoryId", "name", "amount", "month", "warningThreshold"];
const updateFields = ["name", "amount", "warningThreshold"];

const validateCreate = [
  rejectUnknownFields(createFields),
  body("categoryId").isUUID(),
  body("name").isString().trim().notEmpty().isLength({ max: 100 }),
  body("amount").isString().matches(positiveAmount),
  body("month").isString().matches(monthPattern),
  body("warningThreshold").optional().isFloat({ min: 0, max: 100 }).toFloat(),
];

const validateUpdate = [
  rejectUnknownFields(updateFields),
  requireNonEmptyBody(),
  body("name").optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body("amount").optional().isString().matches(positiveAmount),
  body("warningThreshold").optional().isFloat({ min: 0, max: 100 }).toFloat(),
];

const validateBudgetId = [param("budgetId").isUUID()];

const handleRouteError = (
  error: unknown,
  res: Response,
  next: NextFunction
): Response | void => {
  if (error instanceof BudgetServiceError) {
    return sendError(res, error.status, error.code, error.message);
  }
  next(error);
};

router.use(authenticateToken);

router.get(
  "/",
  query("month").optional().isString().matches(monthPattern),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const items = await listBudgets(req.user!.id, req.query.month as string | undefined);
      return res.json({ success: true, data: { items } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.post(
  "/",
  validateCreate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const budget = await createBudget(req.user!.id, {
        categoryId: req.body.categoryId,
        name: req.body.name,
        amount: req.body.amount,
        month: req.body.month,
        warningThreshold: req.body.warningThreshold,
      });
      return res.status(201).json({ success: true, data: { budget } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.patch(
  "/:budgetId",
  [...validateBudgetId, ...validateUpdate],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const budget = await updateBudget(req.user!.id, req.params.budgetId, {
        name: req.body.name,
        amount: req.body.amount,
        warningThreshold: req.body.warningThreshold,
      });
      return res.json({ success: true, data: { budget } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.delete(
  "/:budgetId",
  validateBudgetId,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      await deleteBudget(req.user!.id, req.params.budgetId);
      return res.status(204).send();
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

export default router;
