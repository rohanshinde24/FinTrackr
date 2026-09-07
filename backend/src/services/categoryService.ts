import { IsNull, QueryFailedError } from "typeorm";
import { AppDataSource } from "../config/database";
import { Category, CategoryType } from "../models/Category";

export interface CategoryCreateInput {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
}

export interface CategoryUpdateInput {
  name?: string;
  color?: string | null;
  icon?: string | null;
}

export interface CategoryView {
  id: string;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  createdAt: Date;
}

export class CategoryServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "CategoryServiceError";
  }
}

const categoryRepository = AppDataSource.getRepository(Category);

const saveCategory = async (category: Category): Promise<Category> => {
  try {
    return await categoryRepository.save(category);
  } catch (error) {
    const driverError =
      error instanceof QueryFailedError
        ? (error.driverError as { code?: string })
        : undefined;
    if (driverError?.code === "23505") {
      throw new CategoryServiceError(
        409,
        "CATEGORY_ALREADY_EXISTS",
        "An active category with this name and type already exists"
      );
    }
    throw error;
  }
};

const categoryView = (category: Category): CategoryView => ({
  id: category.id,
  name: category.name,
  type: category.type,
  color: category.color ?? null,
  icon: category.icon ?? null,
  createdAt: category.createdAt,
});

const findOwnedCategory = async (
  userId: string,
  categoryId: string
): Promise<Category> => {
  const category = await categoryRepository.findOne({
    where: { id: categoryId, userId, archivedAt: IsNull() },
  });

  if (!category) {
    throw new CategoryServiceError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }

  return category;
};

const ensureNameAvailable = async (
  userId: string,
  type: CategoryType,
  name: string,
  excludedId?: string
): Promise<void> => {
  const query = categoryRepository
    .createQueryBuilder("category")
    .where("category.userId = :userId", { userId })
    .andWhere("category.type = :type", { type })
    .andWhere("category.archivedAt IS NULL")
    .andWhere("LOWER(category.name) = LOWER(:name)", { name });

  if (excludedId) {
    query.andWhere("category.id != :excludedId", { excludedId });
  }

  if (await query.getExists()) {
    throw new CategoryServiceError(
      409,
      "CATEGORY_ALREADY_EXISTS",
      "An active category with this name and type already exists"
    );
  }
};

export const listCategories = async (
  userId: string,
  type?: CategoryType
): Promise<CategoryView[]> => {
  const categories = await categoryRepository.find({
    where: {
      userId,
      archivedAt: IsNull(),
      ...(type === undefined ? {} : { type }),
    },
    order: { sortOrder: "ASC", name: "ASC", id: "ASC" },
  });

  return categories.map(categoryView);
};

export const createCategory = async (
  userId: string,
  input: CategoryCreateInput
): Promise<CategoryView> => {
  await ensureNameAvailable(userId, input.type, input.name);

  const category = categoryRepository.create({
    ...input,
    userId,
  });

  return categoryView(await saveCategory(category));
};

export const updateCategory = async (
  userId: string,
  categoryId: string,
  input: CategoryUpdateInput
): Promise<CategoryView> => {
  const category = await findOwnedCategory(userId, categoryId);

  if (input.name !== undefined) {
    await ensureNameAvailable(userId, category.type, input.name, category.id);
    category.name = input.name;
  }
  if (input.color !== undefined) category.color = input.color ?? undefined;
  if (input.icon !== undefined) category.icon = input.icon ?? undefined;

  return categoryView(await saveCategory(category));
};

export const archiveCategory = async (
  userId: string,
  categoryId: string
): Promise<void> => {
  const category = await findOwnedCategory(userId, categoryId);
  category.archivedAt = new Date();
  await saveCategory(category);
};
