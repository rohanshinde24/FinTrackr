import request from "supertest";
import express from "express";
import { testDataSource } from "./setup";
import { Transaction } from "../src/models/Transaction";
import { User } from "../src/models/User";
import { Account } from "../src/models/Account";
import { Category } from "../src/models/Category";
import bcrypt from "bcryptjs";

const app = express();
app.use(express.json());

// Mock transaction routes
app.get("/api/transactions", async (req, res) => {
  try {
    const transactionRepository = testDataSource.getRepository(Transaction);
    const transactions = await transactionRepository.find({
      relations: ["account", "category", "user"],
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { amount, description, type, accountId, categoryId, userId, date } =
      req.body;

    if (!amount || !type || !accountId || !userId) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const transactionRepository = testDataSource.getRepository(Transaction);
    const transaction = transactionRepository.create({
      amount,
      description,
      type,
      account: { id: accountId },
      category: categoryId ? { id: categoryId } : null,
      user: { id: userId },
      date: date || new Date(),
    });

    await transactionRepository.save(transaction);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transactionRepository = testDataSource.getRepository(Transaction);

    const transaction = await transactionRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    Object.assign(transaction, req.body);
    await transactionRepository.save(transaction);

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transactionRepository = testDataSource.getRepository(Transaction);

    const transaction = await transactionRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await transactionRepository.remove(transaction);
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

describe("Transaction API", () => {
  let testUser: User;
  let testAccount: Account;
  let testCategory: Category;

  beforeEach(async () => {
    // Create test user
    const userRepository = testDataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash("password123", 10);
    testUser = userRepository.create({
      email: "transaction@example.com",
      password: hashedPassword,
      firstName: "Transaction",
      lastName: "User",
    });
    await userRepository.save(testUser);

    // Create test account
    const accountRepository = testDataSource.getRepository(Account);
    testAccount = accountRepository.create({
      name: "Test Account",
      type: "checking",
      balance: 1000.0,
      user: testUser,
    });
    await accountRepository.save(testAccount);

    // Create test category
    const categoryRepository = testDataSource.getRepository(Category);
    testCategory = categoryRepository.create({
      name: "Food",
      type: "expense",
      user: testUser,
    });
    await categoryRepository.save(testCategory);
  });

  describe("GET /api/transactions", () => {
    it("should return all transactions", async () => {
      const response = await request(app).get("/api/transactions");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("POST /api/transactions", () => {
    it("should create a new transaction", async () => {
      const response = await request(app).post("/api/transactions").send({
        amount: 50.0,
        description: "Grocery shopping",
        type: "expense",
        accountId: testAccount.id,
        categoryId: testCategory.id,
        userId: testUser.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe("50.00");
      expect(response.body.description).toBe("Grocery shopping");
    });

    it("should validate required fields", async () => {
      const response = await request(app).post("/api/transactions").send({
        description: "Missing required fields",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Required fields missing");
    });

    it("should create transaction without category", async () => {
      const response = await request(app).post("/api/transactions").send({
        amount: 100.0,
        description: "No category transaction",
        type: "income",
        accountId: testAccount.id,
        userId: testUser.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe("100.00");
    });
  });

  describe("PUT /api/transactions/:id", () => {
    it("should update an existing transaction", async () => {
      // Create a transaction first
      const transactionRepository = testDataSource.getRepository(Transaction);
      const transaction = transactionRepository.create({
        amount: 50.0,
        description: "Original description",
        type: "expense",
        account: testAccount,
        user: testUser,
        date: new Date(),
      });
      await transactionRepository.save(transaction);

      // Update the transaction
      const response = await request(app)
        .put(`/api/transactions/${transaction.id}`)
        .send({
          description: "Updated description",
          amount: 75.0,
        });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe("Updated description");
      expect(response.body.amount).toBe("75.00");
    });

    it("should return 404 for non-existent transaction", async () => {
      const response = await request(app).put("/api/transactions/99999").send({
        description: "This should fail",
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Transaction not found");
    });
  });

  describe("DELETE /api/transactions/:id", () => {
    it("should delete an existing transaction", async () => {
      // Create a transaction first
      const transactionRepository = testDataSource.getRepository(Transaction);
      const transaction = transactionRepository.create({
        amount: 50.0,
        description: "To be deleted",
        type: "expense",
        account: testAccount,
        user: testUser,
        date: new Date(),
      });
      await transactionRepository.save(transaction);

      // Delete the transaction
      const response = await request(app).delete(
        `/api/transactions/${transaction.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Transaction deleted successfully");

      // Verify deletion
      const deletedTransaction = await transactionRepository.findOne({
        where: { id: transaction.id },
      });
      expect(deletedTransaction).toBeNull();
    });

    it("should return 404 when deleting non-existent transaction", async () => {
      const response = await request(app).delete("/api/transactions/99999");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Transaction not found");
    });
  });
});

