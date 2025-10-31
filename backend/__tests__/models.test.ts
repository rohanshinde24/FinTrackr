import { testDataSource } from "./setup";
import { User } from "../src/models/User";
import { Account } from "../src/models/Account";
import { Transaction } from "../src/models/Transaction";
import { Category } from "../src/models/Category";
import { Budget } from "../src/models/Budget";
import bcrypt from "bcryptjs";

describe("Database Models", () => {
  describe("User Model", () => {
    it("should create a user", async () => {
      const userRepository = testDataSource.getRepository(User);
      const hashedPassword = await bcrypt.hash("password123", 10);

      const user = userRepository.create({
        email: "user@example.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
      });

      await userRepository.save(user);

      expect(user.id).toBeDefined();
      expect(user.email).toBe("user@example.com");
      expect(user.firstName).toBe("John");
      expect(user.lastName).toBe("Doe");
    });

    it("should not allow duplicate emails", async () => {
      const userRepository = testDataSource.getRepository(User);
      const hashedPassword = await bcrypt.hash("password123", 10);

      const user1 = userRepository.create({
        email: "duplicate@example.com",
        password: hashedPassword,
        firstName: "John",
        lastName: "Doe",
      });
      await userRepository.save(user1);

      const user2 = userRepository.create({
        email: "duplicate@example.com",
        password: hashedPassword,
        firstName: "Jane",
        lastName: "Smith",
      });

      await expect(userRepository.save(user2)).rejects.toThrow();
    });
  });

  describe("Account Model", () => {
    let testUser: User;

    beforeEach(async () => {
      const userRepository = testDataSource.getRepository(User);
      const hashedPassword = await bcrypt.hash("password123", 10);
      testUser = userRepository.create({
        email: "account@example.com",
        password: hashedPassword,
        firstName: "Account",
        lastName: "Test",
      });
      await userRepository.save(testUser);
    });

    it("should create an account", async () => {
      const accountRepository = testDataSource.getRepository(Account);

      const account = accountRepository.create({
        name: "Checking Account",
        type: "checking",
        balance: 1000.0,
        user: testUser,
      });

      await accountRepository.save(account);

      expect(account.id).toBeDefined();
      expect(account.name).toBe("Checking Account");
      expect(account.balance).toBe("1000.00");
      expect(account.user.id).toBe(testUser.id);
    });

    it("should support different account types", async () => {
      const accountRepository = testDataSource.getRepository(Account);

      const types = ["checking", "savings", "credit", "investment"];

      for (const type of types) {
        const account = accountRepository.create({
          name: `${type} Account`,
          type,
          balance: 500.0,
          user: testUser,
        });
        await accountRepository.save(account);

        expect(account.type).toBe(type);
      }
    });
  });

  describe("Category Model", () => {
    let testUser: User;

    beforeEach(async () => {
      const userRepository = testDataSource.getRepository(User);
      const hashedPassword = await bcrypt.hash("password123", 10);
      testUser = userRepository.create({
        email: "category@example.com",
        password: hashedPassword,
        firstName: "Category",
        lastName: "Test",
      });
      await userRepository.save(testUser);
    });

    it("should create a category", async () => {
      const categoryRepository = testDataSource.getRepository(Category);

      const category = categoryRepository.create({
        name: "Groceries",
        type: "expense",
        user: testUser,
      });

      await categoryRepository.save(category);

      expect(category.id).toBeDefined();
      expect(category.name).toBe("Groceries");
      expect(category.type).toBe("expense");
    });

    it("should support income and expense types", async () => {
      const categoryRepository = testDataSource.getRepository(Category);

      const expenseCategory = categoryRepository.create({
        name: "Food",
        type: "expense",
        user: testUser,
      });
      await categoryRepository.save(expenseCategory);

      const incomeCategory = categoryRepository.create({
        name: "Salary",
        type: "income",
        user: testUser,
      });
      await categoryRepository.save(incomeCategory);

      expect(expenseCategory.type).toBe("expense");
      expect(incomeCategory.type).toBe("income");
    });
  });

  describe("Transaction Model", () => {
    let testUser: User;
    let testAccount: Account;
    let testCategory: Category;

    beforeEach(async () => {
      const userRepository = testDataSource.getRepository(User);
      const hashedPassword = await bcrypt.hash("password123", 10);
      testUser = userRepository.create({
        email: "transaction@example.com",
        password: hashedPassword,
        firstName: "Transaction",
        lastName: "Test",
      });
      await userRepository.save(testUser);

      const accountRepository = testDataSource.getRepository(Account);
      testAccount = accountRepository.create({
        name: "Test Account",
        type: "checking",
        balance: 1000.0,
        user: testUser,
      });
      await accountRepository.save(testAccount);

      const categoryRepository = testDataSource.getRepository(Category);
      testCategory = categoryRepository.create({
        name: "Food",
        type: "expense",
        user: testUser,
      });
      await categoryRepository.save(testCategory);
    });

    it("should create a transaction", async () => {
      const transactionRepository = testDataSource.getRepository(Transaction);

      const transaction = transactionRepository.create({
        amount: 50.0,
        description: "Grocery shopping",
        type: "expense",
        account: testAccount,
        category: testCategory,
        user: testUser,
        date: new Date(),
      });

      await transactionRepository.save(transaction);

      expect(transaction.id).toBeDefined();
      expect(transaction.amount).toBe("50.00");
      expect(transaction.description).toBe("Grocery shopping");
      expect(transaction.type).toBe("expense");
    });

    it("should link transaction to account and category", async () => {
      const transactionRepository = testDataSource.getRepository(Transaction);

      const transaction = transactionRepository.create({
        amount: 100.0,
        description: "Test transaction",
        type: "expense",
        account: testAccount,
        category: testCategory,
        user: testUser,
        date: new Date(),
      });

      await transactionRepository.save(transaction);

      const savedTransaction = await transactionRepository.findOne({
        where: { id: transaction.id },
        relations: ["account", "category", "user"],
      });

      expect(savedTransaction?.account.id).toBe(testAccount.id);
      expect(savedTransaction?.category.id).toBe(testCategory.id);
      expect(savedTransaction?.user.id).toBe(testUser.id);
    });
  });

  describe("Budget Model", () => {
    let testUser: User;
    let testCategory: Category;

    beforeEach(async () => {
      const userRepository = testDataSource.getRepository(User);
      const hashedPassword = await bcrypt.hash("password123", 10);
      testUser = userRepository.create({
        email: "budget@example.com",
        password: hashedPassword,
        firstName: "Budget",
        lastName: "Test",
      });
      await userRepository.save(testUser);

      const categoryRepository = testDataSource.getRepository(Category);
      testCategory = categoryRepository.create({
        name: "Food",
        type: "expense",
        user: testUser,
      });
      await categoryRepository.save(testCategory);
    });

    it("should create a budget", async () => {
      const budgetRepository = testDataSource.getRepository(Budget);

      const budget = budgetRepository.create({
        name: "Monthly Food Budget",
        amount: 500.0,
        period: "monthly",
        category: testCategory,
        user: testUser,
        startDate: new Date(),
      });

      await budgetRepository.save(budget);

      expect(budget.id).toBeDefined();
      expect(budget.name).toBe("Monthly Food Budget");
      expect(budget.amount).toBe("500.00");
      expect(budget.period).toBe("monthly");
    });

    it("should support different budget periods", async () => {
      const budgetRepository = testDataSource.getRepository(Budget);

      const periods = ["weekly", "monthly", "yearly"];

      for (const period of periods) {
        const budget = budgetRepository.create({
          name: `${period} budget`,
          amount: 1000.0,
          period,
          category: testCategory,
          user: testUser,
          startDate: new Date(),
        });
        await budgetRepository.save(budget);

        expect(budget.period).toBe(period);
      }
    });
  });
});

