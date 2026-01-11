import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  accounts, 
  InsertAccount, 
  Account,
  creditCards,
  InsertCreditCard,
  CreditCard,
  categories,
  InsertCategory,
  Category,
  transactions,
  InsertTransaction,
  Transaction,
  uploadedFiles,
  InsertUploadedFile,
  UploadedFile
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USER HELPERS =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== ACCOUNT HELPERS =====

export async function createAccount(account: InsertAccount): Promise<Account> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(accounts).values(account);
  const insertedId = Number(result[0].insertId);
  
  const [inserted] = await db.select().from(accounts).where(eq(accounts.id, insertedId)).limit(1);
  if (!inserted) throw new Error("Failed to retrieve inserted account");
  
  return inserted;
}

export async function getAccountsByUserId(userId: number): Promise<Account[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(accounts).where(eq(accounts.userId, userId)).orderBy(desc(accounts.createdAt));
}

export async function getAccountById(id: number, userId: number): Promise<Account | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(accounts).where(
    and(eq(accounts.id, id), eq(accounts.userId, userId))
  ).limit(1);

  return result[0];
}

export async function updateAccount(id: number, userId: number, updates: Partial<InsertAccount>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(accounts).set(updates).where(
    and(eq(accounts.id, id), eq(accounts.userId, userId))
  );
}

export async function deleteAccount(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(accounts).where(
    and(eq(accounts.id, id), eq(accounts.userId, userId))
  );
}

// ===== CREDIT CARD HELPERS =====

export async function createCreditCard(card: InsertCreditCard): Promise<CreditCard> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(creditCards).values(card);
  const insertedId = Number(result[0].insertId);
  
  const [inserted] = await db.select().from(creditCards).where(eq(creditCards.id, insertedId)).limit(1);
  if (!inserted) throw new Error("Failed to retrieve inserted credit card");
  
  return inserted;
}

export async function getCreditCardsByUserId(userId: number): Promise<CreditCard[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(creditCards).where(eq(creditCards.userId, userId)).orderBy(desc(creditCards.createdAt));
}

export async function getCreditCardById(id: number, userId: number): Promise<CreditCard | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(creditCards).where(
    and(eq(creditCards.id, id), eq(creditCards.userId, userId))
  ).limit(1);

  return result[0];
}

export async function updateCreditCard(id: number, userId: number, updates: Partial<InsertCreditCard>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(creditCards).set(updates).where(
    and(eq(creditCards.id, id), eq(creditCards.userId, userId))
  );
}

export async function deleteCreditCard(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(creditCards).where(
    and(eq(creditCards.id, id), eq(creditCards.userId, userId))
  );
}

// ===== CATEGORY HELPERS =====

export async function createCategory(category: InsertCategory): Promise<Category> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(categories).values(category);
  const insertedId = Number(result[0].insertId);
  
  const [inserted] = await db.select().from(categories).where(eq(categories.id, insertedId)).limit(1);
  if (!inserted) throw new Error("Failed to retrieve inserted category");
  
  return inserted;
}

export async function getCategoriesByUserId(userId: number): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(categories).where(eq(categories.userId, userId)).orderBy(categories.name);
}

export async function getDefaultCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(categories).where(eq(categories.isDefault, true)).orderBy(categories.name);
}

export async function getAllCategoriesForUser(userId: number): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(categories).where(
    sql`${categories.userId} = ${userId} OR ${categories.isDefault} = true`
  ).orderBy(categories.name);
}

export async function deleteCategory(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(categories).where(
    and(eq(categories.id, id), eq(categories.userId, userId))
  );
}

// ===== TRANSACTION HELPERS =====

export async function createTransaction(transaction: InsertTransaction): Promise<Transaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(transactions).values(transaction);
  const insertedId = Number(result[0].insertId);
  
  const [inserted] = await db.select().from(transactions).where(eq(transactions.id, insertedId)).limit(1);
  if (!inserted) throw new Error("Failed to retrieve inserted transaction");
  
  return inserted;
}

export async function getTransactionsByUserId(userId: number, limit?: number): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.transactionDate));
  
  if (limit) {
    query = query.limit(limit) as any;
  }

  return query;
}

export async function getTransactionsByDateRange(
  userId: number, 
  startDate: Date, 
  endDate: Date
): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(transactions).where(
    and(
      eq(transactions.userId, userId),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate)
    )
  ).orderBy(desc(transactions.transactionDate));
}

export async function getTransactionsByAccount(userId: number, accountId: number): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(transactions).where(
    and(eq(transactions.userId, userId), eq(transactions.accountId, accountId))
  ).orderBy(desc(transactions.transactionDate));
}

export async function getTransactionsByCreditCard(userId: number, creditCardId: number): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(transactions).where(
    and(eq(transactions.userId, userId), eq(transactions.creditCardId, creditCardId))
  ).orderBy(desc(transactions.transactionDate));
}

export async function getTransactionsByCategory(userId: number, categoryId: number): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(transactions).where(
    and(eq(transactions.userId, userId), eq(transactions.categoryId, categoryId))
  ).orderBy(desc(transactions.transactionDate));
}

export async function updateTransaction(id: number, userId: number, updates: Partial<InsertTransaction>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(transactions).set(updates).where(
    and(eq(transactions.id, id), eq(transactions.userId, userId))
  );
}

export async function deleteTransaction(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(transactions).where(
    and(eq(transactions.id, id), eq(transactions.userId, userId))
  );
}

// ===== UPLOADED FILE HELPERS =====

export async function createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(uploadedFiles).values(file);
  const insertedId = Number(result[0].insertId);
  
  const [inserted] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, insertedId)).limit(1);
  if (!inserted) throw new Error("Failed to retrieve inserted file");
  
  return inserted;
}

export async function getUploadedFilesByUserId(userId: number): Promise<UploadedFile[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(uploadedFiles).where(eq(uploadedFiles.userId, userId)).orderBy(desc(uploadedFiles.createdAt));
}

export async function updateUploadedFile(id: number, userId: number, updates: Partial<InsertUploadedFile>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(uploadedFiles).set(updates).where(
    and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId))
  );
}

export async function getUploadedFileById(id: number, userId: number): Promise<UploadedFile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(uploadedFiles).where(
    and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId))
  ).limit(1);

  return result[0];
}
