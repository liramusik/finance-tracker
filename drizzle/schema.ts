import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "viewer"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Bank accounts table
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  bankName: varchar("bankName", { length: 255 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 100 }),
  accountType: mysqlEnum("accountType", ["checking", "savings", "investment"]).default("checking").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Credit cards table
 */
export const creditCards = mysqlTable("creditCards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  bankName: varchar("bankName", { length: 255 }).notNull(),
  lastFourDigits: varchar("lastFourDigits", { length: 4 }),
  creditLimit: decimal("creditLimit", { precision: 15, scale: 2 }).default("0.00").notNull(),
  currentBalance: decimal("currentBalance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  availableCredit: decimal("availableCredit", { precision: 15, scale: 2 }).default("0.00").notNull(),
  closingDay: int("closingDay").default(1),
  paymentDueDay: int("paymentDueDay").default(15),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  color: varchar("color", { length: 7 }).default("#ef4444"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = typeof creditCards.$inferInsert;

/**
 * Categories table for transaction classification
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  color: varchar("color", { length: 7 }).default("#6b7280"),
  icon: varchar("icon", { length: 50 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Transactions table
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId"),
  creditCardId: int("creditCardId"),
  categoryId: int("categoryId"),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  transactionDate: timestamp("transactionDate").notNull(),
  notes: text("notes"),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Uploaded files table for tracking PDFs and screenshots
 */
export const uploadedFiles = mysqlTable("uploadedFiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: mysqlEnum("fileType", ["pdf", "image"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileSize: int("fileSize"),
  processingStatus: mysqlEnum("processingStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  extractedText: text("extractedText"),
  transactionsCount: int("transactionsCount").default(0),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = typeof uploadedFiles.$inferInsert;

/**
 * Bank loans table
 */
export const loans = mysqlTable("loans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bankName: varchar("bankName", { length: 255 }).notNull(),
  loanName: varchar("loanName", { length: 255 }).notNull(),
  loanType: mysqlEnum("loanType", ["personal", "mortgage", "auto", "student", "other"]).notNull(),
  originalAmount: decimal("originalAmount", { precision: 15, scale: 2 }).notNull(),
  currentBalance: decimal("currentBalance", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }).notNull(),
  monthlyPayment: decimal("monthlyPayment", { precision: 15, scale: 2 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  color: varchar("color", { length: 7 }).default("#8b5cf6"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

/**
 * User preferences table for theme and settings
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  theme: mysqlEnum("theme", ["light", "dark", "system"]).default("system").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  language: varchar("language", { length: 5 }).default("es").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;
