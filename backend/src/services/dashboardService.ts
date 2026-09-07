import { AppDataSource } from "../config/database";
import { centsToMoney, moneyToCents } from "../domain/money";
import { reportingMonth, reportingMonthsEnding } from "../domain/reportingMonth";
import { Account } from "../models/Account";
import { Category } from "../models/Category";
import { Transaction, TransactionStatus, TransactionType } from "../models/Transaction";
import { BudgetView, listBudgets } from "./budgetService";

export interface CategorySpendingView {
  categoryId: string;
  name: string;
  total: string;
}

export interface MonthlyTrendView {
  month: string;
  income: string;
  expenses: string;
  net: string;
}

export interface DashboardOverview {
  month: string;
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  netIncome: string;
  categorySpending: CategorySpendingView[];
  budgetProgress: BudgetView[];
  monthlyTrend: MonthlyTrendView[];
}

const accountRepository = AppDataSource.getRepository(Account);
const transactionRepository = AppDataSource.getRepository(Transaction);

const normalizeMoney = (amount: string | null | undefined): string =>
  centsToMoney(moneyToCents(amount ?? "0"));

const openingBalance = async (userId: string): Promise<string> => {
  const result = await accountRepository
    .createQueryBuilder("account")
    .select("COALESCE(SUM(account.openingBalance), 0)::numeric(15,2)", "total")
    .where("account.userId = :userId", { userId })
    .getRawOne<{ total: string }>();
  return result?.total ?? "0.00";
};

const completedBalanceDelta = async (userId: string, end: string): Promise<string> => {
  const result = await transactionRepository
    .createQueryBuilder("transaction")
    .select(
      `COALESCE(SUM(CASE
        WHEN transaction.type = :income THEN transaction.amount
        WHEN transaction.type = :expense THEN -transaction.amount
        ELSE 0
      END), 0)::numeric(15,2)`,
      "total"
    )
    .where("transaction.userId = :userId", { userId })
    .andWhere("transaction.status = :status", { status: TransactionStatus.COMPLETED })
    .andWhere("transaction.date < :end", {
      end,
      income: TransactionType.INCOME,
      expense: TransactionType.EXPENSE,
    })
    .getRawOne<{ total: string }>();
  return result?.total ?? "0.00";
};

const monthlyTotals = async (
  userId: string,
  start: string,
  end: string
): Promise<{ income: string; expenses: string }> => {
  const result = await transactionRepository
    .createQueryBuilder("transaction")
    .select(
      "COALESCE(SUM(CASE WHEN transaction.type = :income THEN transaction.amount ELSE 0 END), 0)::numeric(15,2)",
      "income"
    )
    .addSelect(
      "COALESCE(SUM(CASE WHEN transaction.type = :expense THEN transaction.amount ELSE 0 END), 0)::numeric(15,2)",
      "expenses"
    )
    .where("transaction.userId = :userId", { userId })
    .andWhere("transaction.status = :status", { status: TransactionStatus.COMPLETED })
    .andWhere("transaction.date >= :start", { start })
    .andWhere("transaction.date < :end", {
      end,
      income: TransactionType.INCOME,
      expense: TransactionType.EXPENSE,
    })
    .getRawOne<{ income: string; expenses: string }>();

  return {
    income: result?.income ?? "0.00",
    expenses: result?.expenses ?? "0.00",
  };
};

const categorySpending = async (
  userId: string,
  start: string,
  end: string
): Promise<CategorySpendingView[]> => {
  const rows = await transactionRepository
    .createQueryBuilder("transaction")
    .innerJoin(Category, "category", "category.id = transaction.categoryId")
    .select("category.id", "categoryId")
    .addSelect("category.name", "name")
    .addSelect("SUM(transaction.amount)::numeric(15,2)", "total")
    .where("transaction.userId = :userId", { userId })
    .andWhere("category.userId = :userId", { userId })
    .andWhere("transaction.type = :type", { type: TransactionType.EXPENSE })
    .andWhere("transaction.status = :status", { status: TransactionStatus.COMPLETED })
    .andWhere("transaction.date >= :start", { start })
    .andWhere("transaction.date < :end", { end })
    .groupBy("category.id")
    .addGroupBy("category.name")
    .orderBy("SUM(transaction.amount)", "DESC")
    .addOrderBy("category.name", "ASC")
    .getRawMany<{ categoryId: string; name: string; total: string }>();

  return rows.map((row) => ({ ...row, total: normalizeMoney(row.total) }));
};

const monthlyTrend = async (userId: string, month: string): Promise<MonthlyTrendView[]> => {
  const periods = reportingMonthsEnding(month, 6);
  const rows = await transactionRepository
    .createQueryBuilder("transaction")
    .select("TO_CHAR(transaction.date, 'YYYY-MM')", "month")
    .addSelect(
      "SUM(CASE WHEN transaction.type = :income THEN transaction.amount ELSE 0 END)::numeric(15,2)",
      "income"
    )
    .addSelect(
      "SUM(CASE WHEN transaction.type = :expense THEN transaction.amount ELSE 0 END)::numeric(15,2)",
      "expenses"
    )
    .where("transaction.userId = :userId", { userId })
    .andWhere("transaction.status = :status", { status: TransactionStatus.COMPLETED })
    .andWhere("transaction.date >= :start", { start: periods[0].start })
    .andWhere("transaction.date < :end", {
      end: periods[periods.length - 1].end,
      income: TransactionType.INCOME,
      expense: TransactionType.EXPENSE,
    })
    .groupBy("TO_CHAR(transaction.date, 'YYYY-MM')")
    .getRawMany<{ month: string; income: string; expenses: string }>();

  const totals = new Map(rows.map((row) => [row.month, row]));
  return periods.map((period) => {
    const row = totals.get(period.month);
    const income = moneyToCents(row?.income ?? "0");
    const expenses = moneyToCents(row?.expenses ?? "0");
    return {
      month: period.month,
      income: centsToMoney(income),
      expenses: centsToMoney(expenses),
      net: centsToMoney(income - expenses),
    };
  });
};

export const getDashboardOverview = async (
  userId: string,
  month?: string
): Promise<DashboardOverview> => {
  const period = reportingMonth(month);
  const [opening, balanceDelta, totals, spending, budgets, trend] = await Promise.all([
    openingBalance(userId),
    completedBalanceDelta(userId, period.end),
    monthlyTotals(userId, period.start, period.end),
    categorySpending(userId, period.start, period.end),
    listBudgets(userId, period.month),
    monthlyTrend(userId, period.month),
  ]);

  const income = moneyToCents(totals.income);
  const expenses = moneyToCents(totals.expenses);
  return {
    month: period.month,
    totalBalance: centsToMoney(moneyToCents(opening) + moneyToCents(balanceDelta)),
    monthlyIncome: centsToMoney(income),
    monthlyExpenses: centsToMoney(expenses),
    netIncome: centsToMoney(income - expenses),
    categorySpending: spending,
    budgetProgress: budgets,
    monthlyTrend: trend,
  };
};
