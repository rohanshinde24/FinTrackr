import { User } from "./User";
import { Transaction } from "./Transaction";
export declare enum AccountType {
    CHECKING = "CHECKING",
    SAVINGS = "SAVINGS",
    CREDIT_CARD = "CREDIT_CARD",
    INVESTMENT = "INVESTMENT",
    LOAN = "LOAN",
    OTHER = "OTHER"
}
export declare enum AccountStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    CLOSED = "CLOSED"
}
export declare class Account {
    id: string;
    name: string;
    description?: string;
    type: AccountType;
    status: AccountStatus;
    balance: number;
    availableBalance: number;
    currency: string;
    accountNumber?: string;
    institution?: string;
    color?: string;
    icon?: string;
    isDefault: boolean;
    metadata?: Record<string, any>;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    transactions: Transaction[];
}
