import { NextFunction, Response, Router } from "express";
import { body, param } from "express-validator";
import { sendError } from "../http/respond";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  rejectUnknownFields,
  requireNonEmptyBody,
  sendValidationErrors,
} from "../middleware/requestValidation";
import { AccountStatus, AccountType } from "../models/Account";
import {
  AccountServiceError,
  createAccount,
  deleteAccount,
  getAccount,
  listAccounts,
  updateAccount,
} from "../services/accountService";

const router = Router();

const decimalAmount = /^[0-9]{1,13}(\.[0-9]{1,2})?$/;
const currency = /^[A-Z]{3}$/;
const createFields = ["name", "institution", "type", "openingBalance", "currency"];
const updateFields = ["name", "institution", "status"];

const validateCreate = [
  rejectUnknownFields(createFields),
  body("name").isString().trim().notEmpty().isLength({ max: 100 }),
  body("institution").optional().isString().trim().isLength({ max: 100 }),
  body("type").isIn(Object.values(AccountType)),
  body("openingBalance").isString().matches(decimalAmount),
  body("currency").isString().matches(currency),
];

const validateUpdate = [
  rejectUnknownFields(updateFields),
  requireNonEmptyBody(),
  body("name").optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body("institution")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 100 }),
  body("status").optional().isIn(Object.values(AccountStatus)),
];

const validateAccountId = [param("accountId").isUUID()];

const handleRouteError = (
  error: unknown,
  res: Response,
  next: NextFunction
): Response | void => {
  if (error instanceof AccountServiceError) {
    return sendError(res, error.status, error.code, error.message);
  }
  next(error);
};

router.use(authenticateToken);

router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await listAccounts(req.user!.id);
    return res.json({ success: true, data: { items } });
  } catch (error) {
    return handleRouteError(error, res, next);
  }
});

router.post(
  "/",
  validateCreate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const account = await createAccount(req.user!.id, {
        name: req.body.name,
        institution: req.body.institution,
        type: req.body.type,
        openingBalance: req.body.openingBalance,
        currency: req.body.currency,
      });
      return res.status(201).json({ success: true, data: { account } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.get(
  "/:accountId",
  validateAccountId,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const account = await getAccount(req.user!.id, req.params.accountId);
      return res.json({ success: true, data: { account } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.patch(
  "/:accountId",
  [...validateAccountId, ...validateUpdate],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const account = await updateAccount(req.user!.id, req.params.accountId, {
        name: req.body.name,
        institution: req.body.institution,
        status: req.body.status,
      });
      return res.json({ success: true, data: { account } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.delete(
  "/:accountId",
  validateAccountId,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      await deleteAccount(req.user!.id, req.params.accountId);
      return res.status(204).send();
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

export default router;
