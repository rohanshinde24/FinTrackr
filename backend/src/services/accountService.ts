import { AppDataSource } from "../config/database";
import { centsToMoney, moneyToCents } from "../domain/money";
import { Account, AccountStatus, AccountType } from "../models/Account";
import { Transaction, TransactionStatus, TransactionType } from "../models/Transaction";

export interface AccountCreateInput {
  name: string;
  institution?: string;
  type: AccountType;
  openingBalance: string;
  currency: string;
}

export interface AccountUpdateInput {
  name?: string;
  institution?: string | null;
  status?: AccountStatus;
}

export interface AccountView {
  id: string;
  name: string;
  institution: string | null;
  type: AccountType;
  status: AccountStatus;
  openingBalance: string;
  currentBalance: string;
  currency: string;
  createdAt: Date;
}

export class AccountServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "AccountServiceError";
  }
}

const accountRepository = AppDataSource.getRepository(Account);
const transactionRepository = AppDataSource.getRepository(Transaction);

const accountView = (account: Account, completedDelta = "0.00"): AccountView => ({
  id: account.id,
  name: account.name,
  institution: account.institution ?? null,
  type: account.type,
  status: account.status,
  openingBalance: centsToMoney(moneyToCents(account.openingBalance)),
  currentBalance: centsToMoney(
    moneyToCents(account.openingBalance) + moneyToCents(completedDelta)
  ),
  currency: account.currency,
  createdAt: account.createdAt,
});

const completedDeltas = async (userId: string): Promise<Map<string, string>> => {
  const rows = await transactionRepository
    .createQueryBuilder("transaction")
    .select("transaction.accountId", "accountId")
    .addSelect(
      `COALESCE(SUM(CASE
        WHEN transaction.type = :income THEN transaction.amount
        WHEN transaction.type = :expense THEN -transaction.amount
        ELSE 0
      END), 0)::numeric(15,2)`,
      "delta"
    )
    .where("transaction.userId = :userId", { userId })
    .andWhere("transaction.status = :completed", {
      completed: TransactionStatus.COMPLETED,
      income: TransactionType.INCOME,
      expense: TransactionType.EXPENSE,
    })
    .groupBy("transaction.accountId")
    .getRawMany<{ accountId: string; delta: string }>();

  return new Map(rows.map(({ accountId, delta }) => [accountId, delta]));
};

const findOwnedAccount = async (userId: string, accountId: string): Promise<Account> => {
  const account = await accountRepository.findOne({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new AccountServiceError(404, "ACCOUNT_NOT_FOUND", "Account not found");
  }

  return account;
};

export const listAccounts = async (userId: string): Promise<AccountView[]> => {
  const [accounts, deltas] = await Promise.all([
    accountRepository.find({ where: { userId }, order: { createdAt: "ASC", id: "ASC" } }),
    completedDeltas(userId),
  ]);

  return accounts.map((account) => accountView(account, deltas.get(account.id)));
};

export const getAccount = async (
  userId: string,
  accountId: string
): Promise<AccountView> => {
  const account = await findOwnedAccount(userId, accountId);
  const deltas = await completedDeltas(userId);
  return accountView(account, deltas.get(account.id));
};

export const createAccount = async (
  userId: string,
  input: AccountCreateInput
): Promise<AccountView> => {
  const account = accountRepository.create({
    ...input,
    userId,
    status: AccountStatus.ACTIVE,
  });

  return accountView(await accountRepository.save(account));
};

export const updateAccount = async (
  userId: string,
  accountId: string,
  input: AccountUpdateInput
): Promise<AccountView> => {
  const account = await findOwnedAccount(userId, accountId);

  if (input.name !== undefined) account.name = input.name;
  if (input.institution !== undefined) account.institution = input.institution ?? undefined;
  if (input.status !== undefined) account.status = input.status;

  await accountRepository.save(account);
  const deltas = await completedDeltas(userId);
  return accountView(account, deltas.get(account.id));
};

export const deleteAccount = async (userId: string, accountId: string): Promise<void> => {
  const account = await findOwnedAccount(userId, accountId);
  const transactionCount = await transactionRepository.count({
    where: { accountId: account.id, userId },
  });

  if (transactionCount > 0) {
    throw new AccountServiceError(
      409,
      "ACCOUNT_HAS_TRANSACTIONS",
      "An account with transaction history cannot be deleted"
    );
  }

  await accountRepository.remove(account);
};
