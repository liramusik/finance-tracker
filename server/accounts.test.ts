import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Accounts Management", () => {
  it("should create a new account", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const account = await caller.accounts.create({
      name: "Test Account",
      bankName: "Test Bank",
      accountType: "checking",
      balance: 1000,
      currency: "USD",
    });

    expect(account).toBeDefined();
    expect(account.name).toBe("Test Account");
    expect(account.bankName).toBe("Test Bank");
    expect(Number(account.balance)).toBe(1000);
  });

  it("should list user accounts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const accounts = await caller.accounts.list();

    expect(Array.isArray(accounts)).toBe(true);
  });

  it("should update an account", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create account first
    const account = await caller.accounts.create({
      name: "Update Test",
      bankName: "Test Bank",
      accountType: "savings",
      balance: 500,
      currency: "USD",
    });

    // Update it
    const result = await caller.accounts.update({
      id: account.id,
      balance: 750,
    });

    expect(result.success).toBe(true);
  });

  it("should delete an account", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create account first
    const account = await caller.accounts.create({
      name: "Delete Test",
      bankName: "Test Bank",
      accountType: "checking",
      balance: 100,
      currency: "USD",
    });

    // Delete it
    const result = await caller.accounts.delete({ id: account.id });

    expect(result.success).toBe(true);
  });
});

describe("Credit Cards Management", () => {
  it("should create a new credit card", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const card = await caller.creditCards.create({
      name: "Test Card",
      bankName: "Test Bank",
      creditLimit: 5000,
      currentBalance: 1000,
      currency: "USD",
    });

    expect(card).toBeDefined();
    expect(card.name).toBe("Test Card");
    expect(Number(card.creditLimit)).toBe(5000);
    expect(Number(card.currentBalance)).toBe(1000);
    expect(Number(card.availableCredit)).toBe(4000);
  });

  it("should list user credit cards", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const cards = await caller.creditCards.list();

    expect(Array.isArray(cards)).toBe(true);
  });

  it("should update a credit card", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create card first
    const card = await caller.creditCards.create({
      name: "Update Card Test",
      bankName: "Test Bank",
      creditLimit: 3000,
      currentBalance: 500,
      currency: "USD",
    });

    // Update it
    const result = await caller.creditCards.update({
      id: card.id,
      currentBalance: 800,
    });

    expect(result.success).toBe(true);
  });

  it("should delete a credit card", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create card first
    const card = await caller.creditCards.create({
      name: "Delete Card Test",
      bankName: "Test Bank",
      creditLimit: 2000,
      currentBalance: 0,
      currency: "USD",
    });

    // Delete it
    const result = await caller.creditCards.delete({ id: card.id });

    expect(result.success).toBe(true);
  });
});

describe("Categories Management", () => {
  it("should initialize default categories", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.initializeDefaults();

    expect(result.message).toBeDefined();
  });

  it("should list categories", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();

    expect(Array.isArray(categories)).toBe(true);
  });

  it("should create a custom category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Test Category",
      type: "expense",
      color: "#ff0000",
      icon: "🧪",
    });

    expect(category).toBeDefined();
    expect(category.name).toBe("Test Category");
    expect(category.type).toBe("expense");
    expect(category.isDefault).toBe(false);
  });
});

describe("Transactions Management", () => {
  it("should create a new transaction", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create account first
    const account = await caller.accounts.create({
      name: "Transaction Test Account",
      bankName: "Test Bank",
      accountType: "checking",
      balance: 1000,
      currency: "USD",
    });

    // Create transaction
    const transaction = await caller.transactions.create({
      accountId: account.id,
      type: "expense",
      amount: 50,
      description: "Test Purchase",
      transactionDate: new Date(),
    });

    expect(transaction).toBeDefined();
    expect(transaction.description).toBe("Test Purchase");
    expect(Number(transaction.amount)).toBe(50);
    expect(transaction.type).toBe("expense");
  });

  it("should list transactions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const transactions = await caller.transactions.list();

    expect(Array.isArray(transactions)).toBe(true);
  });

  it("should get recent transactions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const transactions = await caller.transactions.recent({ limit: 5 });

    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeLessThanOrEqual(5);
  });

  it("should get transaction summary", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.transactions.summary();

    expect(summary).toBeDefined();
    expect(typeof summary.totalIncome).toBe("number");
    expect(typeof summary.totalExpenses).toBe("number");
    expect(Array.isArray(summary.byCategory)).toBe(true);
    expect(Array.isArray(summary.byMonth)).toBe(true);
  });

  it("should update a transaction", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create account and transaction first
    const account = await caller.accounts.create({
      name: "Update Transaction Test",
      bankName: "Test Bank",
      accountType: "checking",
      balance: 1000,
      currency: "USD",
    });

    const transaction = await caller.transactions.create({
      accountId: account.id,
      type: "expense",
      amount: 100,
      description: "Original Description",
      transactionDate: new Date(),
    });

    // Update it
    const result = await caller.transactions.update({
      id: transaction.id,
      description: "Updated Description",
      amount: 150,
    });

    expect(result.success).toBe(true);
  });

  it("should delete a transaction", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create account and transaction first
    const account = await caller.accounts.create({
      name: "Delete Transaction Test",
      bankName: "Test Bank",
      accountType: "checking",
      balance: 1000,
      currency: "USD",
    });

    const transaction = await caller.transactions.create({
      accountId: account.id,
      type: "expense",
      amount: 75,
      description: "To Be Deleted",
      transactionDate: new Date(),
    });

    // Delete it
    const result = await caller.transactions.delete({ id: transaction.id });

    expect(result.success).toBe(true);
  });
});
