import { NextFunction, Response, Router } from "express";
import { body, param, query } from "express-validator";
import { sendError } from "../http/respond";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  rejectUnknownFields,
  requireNonEmptyBody,
  sendValidationErrors,
} from "../middleware/requestValidation";
import { TransactionStatus, TransactionType } from "../models/Transaction";
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  TransactionServiceError,
  updateTransaction,
} from "../services/transactionService";

const router = Router();

const positiveAmount = /^(?=.*[1-9])[0-9]{1,13}(\.[0-9]{1,2})?$/;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const createFields = [
  "accountId",
  "categoryId",
  "description",
  "type",
  "amount",
  "date",
  "notes",
];
const updateFields = [...createFields, "status"];

const dateValidator = (field: string) =>
  body(field).isString().matches(isoDate).isISO8601({ strict: true });

const optionalDateQuery = (field: string) =>
  query(field).optional().isString().matches(isoDate).isISO8601({ strict: true });

const validateCreate = [
  rejectUnknownFields(createFields),
  body("accountId").isUUID(),
  body("categoryId").isUUID(),
  body("description").isString().trim().notEmpty().isLength({ max: 200 }),
  body("type").isIn(Object.values(TransactionType)),
  body("amount").isString().matches(positiveAmount),
  dateValidator("date"),
  body("notes").optional().isString().trim().isLength({ max: 1000 }),
];

const validateUpdate = [
  rejectUnknownFields(updateFields),
  requireNonEmptyBody(),
  body("accountId").optional().isUUID(),
  body("categoryId").optional({ nullable: true }).isUUID(),
  body("description").optional().isString().trim().notEmpty().isLength({ max: 200 }),
  body("type").optional().isIn(Object.values(TransactionType)),
  body("status").optional().isIn(Object.values(TransactionStatus)),
  body("amount").optional().isString().matches(positiveAmount),
  dateValidator("date").optional(),
  body("notes").optional({ nullable: true }).isString().trim().isLength({ max: 1000 }),
];

const validateList = [
  query("cursor").optional().isString().notEmpty(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("accountId").optional().isUUID(),
  query("categoryId").optional().isUUID(),
  query("type").optional().isIn(Object.values(TransactionType)),
  optionalDateQuery("from"),
  optionalDateQuery("to"),
  query("to").custom((value, { req }) => {
    const from = req.query?.from;
    if (typeof from === "string" && typeof value === "string" && from > value) {
      throw new Error("The from date must not be after the to date");
    }
    return true;
  }),
];

const validateTransactionId = [param("transactionId").isUUID()];

const handleRouteError = (
  error: unknown,
  res: Response,
  next: NextFunction
): Response | void => {
  if (error instanceof TransactionServiceError) {
    return sendError(res, error.status, error.code, error.message);
  }
  next(error);
};

router.use(authenticateToken);

router.get(
  "/",
  validateList,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const data = await listTransactions(req.user!.id, {
        cursor: req.query.cursor as string | undefined,
        limit: (req.query.limit as unknown as number | undefined) ?? 25,
        accountId: req.query.accountId as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        type: req.query.type as TransactionType | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      });
      return res.json({ success: true, data });
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
      const transaction = await createTransaction(req.user!.id, {
        accountId: req.body.accountId,
        categoryId: req.body.categoryId,
        description: req.body.description,
        type: req.body.type,
        amount: req.body.amount,
        date: req.body.date,
        notes: req.body.notes,
      });
      return res.status(201).json({ success: true, data: { transaction } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.get(
  "/:transactionId",
  validateTransactionId,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const transaction = await getTransaction(req.user!.id, req.params.transactionId);
      return res.json({ success: true, data: { transaction } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.patch(
  "/:transactionId",
  [...validateTransactionId, ...validateUpdate],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const transaction = await updateTransaction(
        req.user!.id,
        req.params.transactionId,
        {
          accountId: req.body.accountId,
          categoryId: req.body.categoryId,
          description: req.body.description,
          type: req.body.type,
          status: req.body.status,
          amount: req.body.amount,
          date: req.body.date,
          notes: req.body.notes,
        }
      );
      return res.json({ success: true, data: { transaction } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.delete(
  "/:transactionId",
  validateTransactionId,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      await deleteTransaction(req.user!.id, req.params.transactionId);
      return res.status(204).send();
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

export default router;
