import { IsNull, QueryFailedError } from "typeorm";
import { AppDataSource } from "../config/database";
import { centsToMoney, moneyToCents } from "../domain/money";
import { reportingMonth } from "../domain/reportingMonth";
import { Budget } from "../models/Budget";
import { Category, CategoryType } from "../models/Category";
import { Transaction, TransactionStatus, TransactionType } from "../models/Transaction";

export interface BudgetCreateInput {
  categoryId: string;
  name: string;
  amount: string;
  month: string;
  warningThreshold?: number;
}

export interface BudgetUpdateInput {
  name?: string;
  amount?: string;
  warningThreshold?: number;
}

export interface BudgetView {
  id: string;
  categoryId: string;
  name: string;
  amount: string;
  month: string;
  spent: string;
  remaining: string;
  percentage: number;
  createdAt: Date;
}

export class BudgetServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "BudgetServiceError";
  }
}

const budgetRepository = AppDataSource.getRepository(Budget);
const categoryRepository = AppDataSource.getRepository(Category);
const transactionRepository = AppDataSource.getRepository(Transaction);

const dateString = (date: Date | string): string =>
  date instanceof Date ? date.toISOString().slice(0, 10) : date;

const budgetView = (budget: Budget, spentAmount = "0.00"): BudgetView => {
  const amount = moneyToCents(budget.amount);
  const spent = moneyToCents(spentAmount);
  const percentageHundredths = (spent * 10000n + amount / 2n) / amount;

  return {
    id: budget.id,
    categoryId: budget.categoryId,
    name: budget.name,
    amount: centsToMoney(amount),
    month: dateString(budget.startDate).slice(0, 7),
    spent: centsToMoney(spent),
    remaining: centsToMoney(amount - spent),
    percentage: Number(percentageHundredths) / 100,
    createdAt: budget.createdAt,
  };
};

const duplicateBudgetError = (): BudgetServiceError =>
  new BudgetServiceError(
    409,
    "BUDGET_ALREADY_EXISTS",
    "A budget already exists for this category and month"
  );

const saveBudget = async (budget: Budget): Promise<Budget> => {
  try {
    return await budgetRepository.save(budget);
  } catch (error) {
    const driverError =
      error instanceof QueryFailedError
        ? (error.driverError as { code?: string })
        : undefined;
    if (driverError?.code === "23505") throw duplicateBudgetError();
    throw error;
  }
};

const findOwnedBudget = async (userId: string, budgetId: string): Promise<Budget> => {
  const budget = await budgetRepository.findOne({ where: { id: budgetId, userId } });
  if (!budget) {
    throw new BudgetServiceError(404, "BUDGET_NOT_FOUND", "Budget not found");
  }
  return budget;
};

const requireExpenseCategory = async (
  userId: string,
  categoryId: string
): Promise<void> => {
  const category = await categoryRepository.findOne({
    where: { id: categoryId, userId, archivedAt: IsNull() },
  });
  if (!category) {
    throw new BudgetServiceError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }
  if (category.type !== CategoryType.EXPENSE) {
    throw new BudgetServiceError(
      409,
      "BUDGET_REQUIRES_EXPENSE_CATEGORY",
      "Budgets can only use expense categories"
    );
  }
};

const spendingByCategory = async (
  userId: string,
  start: string,
  end: string
): Promise<Map<string, string>> => {
  const rows = await transactionRepository
    .createQueryBuilder("transaction")
    .select("transaction.categoryId", "categoryId")
    .addSelect("SUM(transaction.amount)::numeric(15,2)", "spent")
    .where("transaction.userId = :userId", { userId })
    .andWhere("transaction.type = :type", { type: TransactionType.EXPENSE })
    .andWhere("transaction.status = :status", { status: TransactionStatus.COMPLETED })
    .andWhere("transaction.date >= :start", { start })
    .andWhere("transaction.date < :end", { end })
    .andWhere("transaction.categoryId IS NOT NULL")
    .groupBy("transaction.categoryId")
    .getRawMany<{ categoryId: string; spent: string }>();

  return new Map(rows.map(({ categoryId, spent }) => [categoryId, spent]));
};

const spendingForBudget = async (budget: Budget): Promise<string> => {
  const start = dateString(budget.startDate);
  const end = dateString(budget.endDate);
  const spending = await spendingByCategory(budget.userId, start, end);
  return spending.get(budget.categoryId) ?? "0.00";
};

export const listBudgets = async (userId: string, month?: string): Promise<BudgetView[]> => {
  const period = reportingMonth(month);
  const [budgets, spending] = await Promise.all([
    budgetRepository.find({
      where: { userId, startDate: period.start as unknown as Date },
      order: { name: "ASC", id: "ASC" },
    }),
    spendingByCategory(userId, period.start, period.end),
  ]);

  return budgets.map((budget) => budgetView(budget, spending.get(budget.categoryId)));
};

export const createBudget = async (
  userId: string,
  input: BudgetCreateInput
): Promise<BudgetView> => {
  const period = reportingMonth(input.month);
  await requireExpenseCategory(userId, input.categoryId);

  const existing = await budgetRepository.findOne({
    where: {
      userId,
      categoryId: input.categoryId,
      startDate: period.start as unknown as Date,
    },
  });
  if (existing) throw duplicateBudgetError();

  const budget = budgetRepository.create({
    userId,
    categoryId: input.categoryId,
    name: input.name,
    amount: input.amount,
    startDate: period.start as unknown as Date,
    endDate: period.end as unknown as Date,
    warningThreshold: String(input.warningThreshold ?? 80),
  });

  return budgetView(await saveBudget(budget));
};

export const updateBudget = async (
  userId: string,
  budgetId: string,
  input: BudgetUpdateInput
): Promise<BudgetView> => {
  const budget = await findOwnedBudget(userId, budgetId);
  if (input.name !== undefined) budget.name = input.name;
  if (input.amount !== undefined) budget.amount = input.amount;
  if (input.warningThreshold !== undefined) {
    budget.warningThreshold = String(input.warningThreshold);
  }

  await saveBudget(budget);
  return budgetView(budget, await spendingForBudget(budget));
};

export const deleteBudget = async (userId: string, budgetId: string): Promise<void> => {
  const budget = await findOwnedBudget(userId, budgetId);
  await budgetRepository.remove(budget);
};
