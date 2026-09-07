import { IsNull } from "typeorm";
import { AppDataSource } from "../config/database";
import { Account, AccountStatus } from "../models/Account";
import { Category, CategoryType } from "../models/Category";
import { Transaction, TransactionStatus, TransactionType } from "../models/Transaction";

export interface TransactionCreateInput {
  accountId: string;
  categoryId: string;
  description: string;
  type: TransactionType;
  amount: string;
  date: string;
  notes?: string;
}

export interface TransactionUpdateInput {
  accountId?: string;
  categoryId?: string | null;
  description?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  amount?: string;
  date?: string;
  notes?: string | null;
}

export interface TransactionListFilters {
  cursor?: string;
  limit: number;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
}

export interface TransactionView {
  id: string;
  accountId: string;
  categoryId: string | null;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  date: string;
  notes: string | null;
  createdAt: Date;
}

export interface TransactionPage {
  items: TransactionView[];
  nextCursor: string | null;
}

interface TransactionCursor {
  date: string;
  id: string;
}

export class TransactionServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "TransactionServiceError";
  }
}

const transactionRepository = AppDataSource.getRepository(Transaction);
const accountRepository = AppDataSource.getRepository(Account);
const categoryRepository = AppDataSource.getRepository(Category);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const dateString = (date: Date | string): string =>
  date instanceof Date ? date.toISOString().slice(0, 10) : date;

const transactionView = (transaction: Transaction): TransactionView => ({
  id: transaction.id,
  accountId: transaction.accountId,
  categoryId: transaction.categoryId ?? null,
  description: transaction.description,
  type: transaction.type,
  status: transaction.status,
  amount: transaction.amount,
  date: dateString(transaction.date),
  notes: transaction.notes ?? null,
  createdAt: transaction.createdAt,
});

const encodeCursor = (transaction: Transaction): string =>
  Buffer.from(
    JSON.stringify({ date: dateString(transaction.date), id: transaction.id })
  ).toString("base64url");

const decodeCursor = (cursor: string): TransactionCursor => {
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (
      !value ||
      typeof value !== "object" ||
      !datePattern.test(value.date) ||
      !uuidPattern.test(value.id)
    ) {
      throw new Error("Invalid cursor payload");
    }
    return { date: value.date, id: value.id };
  } catch {
    throw new TransactionServiceError(400, "INVALID_CURSOR", "Cursor is invalid");
  }
};

const findOwnedTransaction = async (
  userId: string,
  transactionId: string
): Promise<Transaction> => {
  const transaction = await transactionRepository.findOne({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    throw new TransactionServiceError(
      404,
      "TRANSACTION_NOT_FOUND",
      "Transaction not found"
    );
  }

  return transaction;
};

const requireActiveAccount = async (userId: string, accountId: string): Promise<void> => {
  const account = await accountRepository.findOne({ where: { id: accountId, userId } });
  if (!account) {
    throw new TransactionServiceError(404, "ACCOUNT_NOT_FOUND", "Account not found");
  }
  if (account.status !== AccountStatus.ACTIVE) {
    throw new TransactionServiceError(
      409,
      "ACCOUNT_NOT_ACTIVE",
      "Transactions can only be added to an active account"
    );
  }
};

const requireMatchingCategory = async (
  userId: string,
  categoryId: string,
  type: TransactionType
): Promise<void> => {
  const category = await categoryRepository.findOne({
    where: { id: categoryId, userId, archivedAt: IsNull() },
  });
  if (!category) {
    throw new TransactionServiceError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }
  if (category.type !== (type as unknown as CategoryType)) {
    throw new TransactionServiceError(
      409,
      "CATEGORY_TYPE_MISMATCH",
      "Transaction and category types must match"
    );
  }
};

export const listTransactions = async (
  userId: string,
  filters: TransactionListFilters
): Promise<TransactionPage> => {
  const query = transactionRepository
    .createQueryBuilder("transaction")
    .where("transaction.userId = :userId", { userId })
    .orderBy("transaction.date", "DESC")
    .addOrderBy("transaction.id", "DESC")
    .take(filters.limit + 1);

  if (filters.cursor) {
    const cursor = decodeCursor(filters.cursor);
    query.andWhere(
      `(transaction.date < :cursorDate OR
        (transaction.date = :cursorDate AND transaction.id < :cursorId))`,
      { cursorDate: cursor.date, cursorId: cursor.id }
    );
  }
  if (filters.accountId) {
    query.andWhere("transaction.accountId = :accountId", {
      accountId: filters.accountId,
    });
  }
  if (filters.categoryId) {
    query.andWhere("transaction.categoryId = :categoryId", {
      categoryId: filters.categoryId,
    });
  }
  if (filters.type) {
    query.andWhere("transaction.type = :type", { type: filters.type });
  }
  if (filters.from) {
    query.andWhere("transaction.date >= :from", { from: filters.from });
  }
  if (filters.to) {
    query.andWhere("transaction.date <= :to", { to: filters.to });
  }

  const rows = await query.getMany();
  const hasNextPage = rows.length > filters.limit;
  const pageRows = rows.slice(0, filters.limit);

  return {
    items: pageRows.map(transactionView),
    nextCursor:
      hasNextPage && pageRows.length > 0
        ? encodeCursor(pageRows[pageRows.length - 1])
        : null,
  };
};

export const getTransaction = async (
  userId: string,
  transactionId: string
): Promise<TransactionView> => transactionView(await findOwnedTransaction(userId, transactionId));

export const createTransaction = async (
  userId: string,
  input: TransactionCreateInput
): Promise<TransactionView> => {
  await Promise.all([
    requireActiveAccount(userId, input.accountId),
    requireMatchingCategory(userId, input.categoryId, input.type),
  ]);

  const transaction = transactionRepository.create({
    ...input,
    date: input.date as unknown as Date,
    userId,
    status: TransactionStatus.COMPLETED,
  });

  return transactionView(await transactionRepository.save(transaction));
};

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  input: TransactionUpdateInput
): Promise<TransactionView> => {
  const transaction = await findOwnedTransaction(userId, transactionId);
  const nextType = input.type ?? transaction.type;

  if (input.accountId !== undefined) {
    await requireActiveAccount(userId, input.accountId);
  }
  if (input.categoryId !== undefined || input.type !== undefined) {
    const nextCategoryId =
      input.categoryId === undefined ? transaction.categoryId : input.categoryId;
    if (nextCategoryId) {
      await requireMatchingCategory(userId, nextCategoryId, nextType);
    }
  }

  if (input.accountId !== undefined) transaction.accountId = input.accountId;
  if (input.categoryId !== undefined) transaction.categoryId = input.categoryId;
  if (input.description !== undefined) transaction.description = input.description;
  if (input.type !== undefined) transaction.type = input.type;
  if (input.status !== undefined) transaction.status = input.status;
  if (input.amount !== undefined) transaction.amount = input.amount;
  if (input.date !== undefined) transaction.date = input.date as unknown as Date;
  if (input.notes !== undefined) transaction.notes = input.notes;

  return transactionView(await transactionRepository.save(transaction));
};

export const deleteTransaction = async (
  userId: string,
  transactionId: string
): Promise<void> => {
  const transaction = await findOwnedTransaction(userId, transactionId);
  await transactionRepository.remove(transaction);
};
