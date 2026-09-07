import { NextFunction, Response, Router } from "express";
import { body, param, query } from "express-validator";
import { sendError } from "../http/respond";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import {
  rejectUnknownFields,
  requireNonEmptyBody,
  sendValidationErrors,
} from "../middleware/requestValidation";
import { CategoryType } from "../models/Category";
import {
  archiveCategory,
  CategoryServiceError,
  createCategory,
  listCategories,
  updateCategory,
} from "../services/categoryService";

const router = Router();

const hexColor = /^#[0-9A-Fa-f]{6}$/;
const createFields = ["name", "type", "color", "icon"];
const updateFields = ["name", "color", "icon"];

const validateCreate = [
  rejectUnknownFields(createFields),
  body("name").isString().trim().notEmpty().isLength({ max: 80 }),
  body("type").isIn(Object.values(CategoryType)),
  body("color").optional().isString().matches(hexColor),
  body("icon").optional().isString().trim().isLength({ max: 50 }),
];

const validateUpdate = [
  rejectUnknownFields(updateFields),
  requireNonEmptyBody(),
  body("name").optional().isString().trim().notEmpty().isLength({ max: 80 }),
  body("color").optional({ nullable: true }).isString().matches(hexColor),
  body("icon").optional({ nullable: true }).isString().trim().isLength({ max: 50 }),
];

const validateCategoryId = [param("categoryId").isUUID()];

const handleRouteError = (
  error: unknown,
  res: Response,
  next: NextFunction
): Response | void => {
  if (error instanceof CategoryServiceError) {
    return sendError(res, error.status, error.code, error.message);
  }
  next(error);
};

router.use(authenticateToken);

router.get(
  "/",
  query("type").optional().isIn(Object.values(CategoryType)),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const items = await listCategories(req.user!.id, req.query.type as CategoryType);
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
      const category = await createCategory(req.user!.id, {
        name: req.body.name,
        type: req.body.type,
        color: req.body.color,
        icon: req.body.icon,
      });
      return res.status(201).json({ success: true, data: { category } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.patch(
  "/:categoryId",
  [...validateCategoryId, ...validateUpdate],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      const category = await updateCategory(req.user!.id, req.params.categoryId, {
        name: req.body.name,
        color: req.body.color,
        icon: req.body.icon,
      });
      return res.json({ success: true, data: { category } });
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

router.delete(
  "/:categoryId",
  validateCategoryId,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const validationResponse = sendValidationErrors(req, res);
    if (validationResponse) return validationResponse;

    try {
      await archiveCategory(req.user!.id, req.params.categoryId);
      return res.status(204).send();
    } catch (error) {
      return handleRouteError(error, res, next);
    }
  }
);

export default router;
