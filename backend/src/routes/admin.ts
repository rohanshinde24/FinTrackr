import { Router, Response } from "express";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../models/User";
import { Transaction } from "../models/Transaction";
import { Account } from "../models/Account";
import { Budget } from "../models/Budget";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { requireAdmin, requireSuperAdmin } from "../middleware/adminAuth";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

/**
 * @route GET /api/admin/users
 * @desc Get all users (admin only)
 * @access Admin
 */
router.get(
  "/users",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { page = 1, limit = 20, search, role, sortBy = "createdAt", order = "DESC" } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      let query = userRepository.createQueryBuilder("user");

      // Search filter
      if (search) {
        query = query.where(
          "(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      // Role filter
      if (role && Object.values(UserRole).includes(role as UserRole)) {
        query = query.andWhere("user.role = :role", { role });
      }

      // Count total users
      const total = await query.getCount();

      // Apply pagination and sorting
      const users = await query
        .select([
          "user.id",
          "user.email",
          "user.firstName",
          "user.lastName",
          "user.role",
          "user.isEmailVerified",
          "user.defaultCurrency",
          "user.language",
          "user.theme",
          "user.createdAt",
          "user.updatedAt",
        ])
        .orderBy(`user.${sortBy}`, order as "ASC" | "DESC")
        .skip(skip)
        .take(limitNum)
        .getMany();

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch users",
      });
    }
  }
);

/**
 * @route GET /api/admin/users/:id
 * @desc Get user details by ID (admin only)
 * @access Admin
 */
router.get(
  "/users/:id",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;

      const user = await userRepository.findOne({
        where: { id },
        relations: ["accounts", "transactions", "budgets"],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: { user: userWithoutPassword },
      });
    } catch (error) {
      console.error("Admin get user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user",
      });
    }
  }
);

/**
 * @route GET /api/admin/stats
 * @desc Get platform statistics (admin only)
 * @access Admin
 */
router.get(
  "/stats",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const transactionRepository = AppDataSource.getRepository(Transaction);
      const accountRepository = AppDataSource.getRepository(Account);
      const budgetRepository = AppDataSource.getRepository(Budget);

      // Get counts
      const [totalUsers, totalTransactions, totalAccounts, totalBudgets] = await Promise.all([
        userRepository.count(),
        transactionRepository.count(),
        accountRepository.count(),
        budgetRepository.count(),
      ]);

      // Get users by role
      const usersByRole = await userRepository
        .createQueryBuilder("user")
        .select("user.role", "role")
        .addSelect("COUNT(*)", "count")
        .groupBy("user.role")
        .getRawMany();

      // Get recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSignups = await userRepository.count({
        where: {
          createdAt: AppDataSource.createQueryBuilder()
            .where("createdAt >= :date", { date: thirtyDaysAgo })
            .getQuery() as any,
        },
      });

      // Get verified vs unverified users
      const verifiedUsers = await userRepository.count({
        where: { isEmailVerified: true },
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalTransactions,
            totalAccounts,
            totalBudgets,
          },
          users: {
            byRole: usersByRole.reduce((acc: any, item) => {
              acc[item.role] = parseInt(item.count);
              return acc;
            }, {}),
            recentSignups,
            verifiedUsers,
            unverifiedUsers: totalUsers - verifiedUsers,
          },
        },
      });
    } catch (error) {
      console.error("Admin get stats error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch statistics",
      });
    }
  }
);

/**
 * @route PATCH /api/admin/users/:id/role
 * @desc Update user role (super admin only)
 * @access Super Admin
 */
router.patch(
  "/users/:id/role",
  authenticateToken,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Invalid role. Must be USER, ADMIN, or SUPER_ADMIN",
        });
      }

      const user = await userRepository.findOne({ where: { id } });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Prevent changing own role
      if (user.id === req.user?.id) {
        return res.status(403).json({
          success: false,
          error: "Cannot change your own role",
        });
      }

      user.role = role;
      await userRepository.save(user);

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: "User role updated successfully",
        data: { user: userWithoutPassword },
      });
    } catch (error) {
      console.error("Admin update role error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user role",
      });
    }
  }
);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete a user (super admin only)
 * @access Super Admin
 */
router.delete(
  "/users/:id",
  authenticateToken,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;

      const user = await userRepository.findOne({ where: { id } });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Prevent deleting own account
      if (user.id === req.user?.id) {
        return res.status(403).json({
          success: false,
          error: "Cannot delete your own account",
        });
      }

      await userRepository.remove(user);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete user",
      });
    }
  }
);

/**
 * @route PATCH /api/admin/users/:id/verify
 * @desc Manually verify user email (admin only)
 * @access Admin
 */
router.patch(
  "/users/:id/verify",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;

      const user = await userRepository.findOne({ where: { id } });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      user.isEmailVerified = true;
      await userRepository.save(user);

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: "User email verified successfully",
        data: { user: userWithoutPassword },
      });
    } catch (error) {
      console.error("Admin verify user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify user",
      });
    }
  }
);

export default router;

