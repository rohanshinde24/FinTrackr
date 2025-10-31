import { Account } from "./Account";
import { Transaction } from "./Transaction";
import { Budget } from "./Budget";
export declare class User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isEmailVerified: boolean;
    defaultCurrency: string;
    language: string;
    theme: string;
    preferences?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    accounts: Account[];
    transactions: Transaction[];
    budgets: Budget[];
}
