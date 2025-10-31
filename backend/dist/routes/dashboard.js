"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Mock data for testing without database
const mockDashboardData = {
    totalBalance: 15420.5,
    monthlyIncome: 5500.0,
    monthlyExpenses: 3200.75,
    netIncome: 2299.25,
    recentTransactions: [
        {
            id: 1,
            amount: 1200.0,
            description: "Salary",
            type: "INCOME",
            date: "2025-09-01T00:00:00Z",
            account: { name: "Checking Account" },
            category: { name: "Salary" },
        },
        {
            id: 2,
            amount: -85.5,
            description: "Grocery Shopping",
            type: "EXPENSE",
            date: "2025-08-31T00:00:00Z",
            account: { name: "Credit Card" },
            category: { name: "Food & Dining" },
        },
        {
            id: 3,
            amount: -1200.0,
            description: "Rent Payment",
            type: "EXPENSE",
            date: "2025-08-30T00:00:00Z",
            account: { name: "Checking Account" },
            category: { name: "Housing" },
        },
        {
            id: 4,
            amount: -45.0,
            description: "Netflix Subscription",
            type: "EXPENSE",
            date: "2025-08-29T00:00:00Z",
            account: { name: "Credit Card" },
            category: { name: "Entertainment" },
        },
        {
            id: 5,
            amount: 500.0,
            description: "Freelance Work",
            type: "INCOME",
            date: "2025-08-28T00:00:00Z",
            account: { name: "Savings Account" },
            category: { name: "Freelance" },
        },
    ],
    budgetProgress: [
        {
            id: 1,
            name: "Food & Dining",
            amount: 400,
            spent: 285.5,
            remaining: 114.5,
            percentage: 71,
            category: "Food & Dining",
        },
        {
            id: 2,
            name: "Entertainment",
            amount: 200,
            spent: 145.0,
            remaining: 55.0,
            percentage: 73,
            category: "Entertainment",
        },
        {
            id: 3,
            name: "Transportation",
            amount: 300,
            spent: 180.25,
            remaining: 119.75,
            percentage: 60,
            category: "Transportation",
        },
        {
            id: 4,
            name: "Shopping",
            amount: 150,
            spent: 95.0,
            remaining: 55.0,
            percentage: 63,
            category: "Shopping",
        },
    ],
    categorySpending: [
        { categoryName: "Housing", total: "1200.00" },
        { categoryName: "Food & Dining", total: "285.50" },
        { categoryName: "Transportation", total: "180.25" },
        { categoryName: "Entertainment", total: "145.00" },
        { categoryName: "Shopping", total: "95.00" },
        { categoryName: "Utilities", total: "85.00" },
        { categoryName: "Healthcare", total: "65.00" },
    ],
};
const mockTrendsData = {
    trends: [
        { month: "2025-03", income: 5200, expenses: 3100, net: 2100 },
        { month: "2025-04", income: 5400, expenses: 3200, net: 2200 },
        { month: "2025-05", income: 5300, expenses: 3150, net: 2150 },
        { month: "2025-06", income: 5500, expenses: 3300, net: 2200 },
        { month: "2025-07", income: 5600, expenses: 3250, net: 2350 },
        { month: "2025-08", income: 5500, expenses: 3200, net: 2300 },
    ],
};
// Get dashboard overview
router.get("/overview", (req, res) => {
    try {
        res.json({
            success: true,
            data: mockDashboardData,
        });
    }
    catch (error) {
        console.error("Dashboard overview error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch dashboard overview",
        });
    }
});
// Get spending trends
router.get("/trends", (req, res) => {
    try {
        res.json({
            success: true,
            data: mockTrendsData,
        });
    }
    catch (error) {
        console.error("Trends error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch spending trends",
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map