import { User } from "./User";
import { Category } from "./Category";
export declare enum BudgetPeriod {
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    YEARLY = "YEARLY",
    CUSTOM = "CUSTOM"
}
export declare enum BudgetStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    OVERDUE = "OVERDUE"
}
export declare class Budget {
    id: string;
    name: string;
    description?: string;
    amount: number;
    period: BudgetPeriod;
    status: BudgetStatus;
    startDate: Date;
    endDate?: Date;
    lastResetDate?: Date;
    spent: number;
    remaining: number;
    color?: string;
    icon?: string;
    metadata?: Record<string, any>;
    isRecurring: boolean;
    sendNotifications: boolean;
    warningThreshold: number;
    criticalThreshold: number;
    userId: string;
    categoryId?: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    category?: Category;
}
