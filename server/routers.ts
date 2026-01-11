import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { processFile } from "./fileProcessor";
import { categorizeTransaction, parseStatementText, getDefaultCategoryData } from "./aiCategorizer";
import { TRPCError } from "@trpc/server";

// Procedimiento protegido solo para admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores pueden realizar esta acción" });
  }
  return next({ ctx });
});

// Procedimiento protegido para lectura (admin y viewer)
const readProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "viewer") {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para acceder" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Accounts router
  accounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getAccountsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        bankName: z.string(),
        accountNumber: z.string().optional(),
        accountType: z.enum(["checking", "savings", "investment"]),
        balance: z.number(),
        currency: z.string().default("USD"),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createAccount({
          userId: ctx.user.id,
          ...input,
          balance: input.balance.toString(),
        });
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        accountType: z.enum(["checking", "savings", "investment"]).optional(),
        balance: z.number().optional(),
        currency: z.string().optional(),
        color: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const updateData: any = { ...updates };
        if (updates.balance !== undefined) {
          updateData.balance = updates.balance.toString();
        }
        await db.updateAccount(id, ctx.user.id, updateData);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAccount(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Credit Cards router
  creditCards: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCreditCardsByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        bankName: z.string(),
        lastFourDigits: z.string().optional(),
        creditLimit: z.number(),
        currentBalance: z.number(),
        closingDay: z.number().optional(),
        paymentDueDay: z.number().optional(),
        currency: z.string().default("USD"),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const availableCredit = input.creditLimit - input.currentBalance;
        return db.createCreditCard({
          userId: ctx.user.id,
          ...input,
          creditLimit: input.creditLimit.toString(),
          currentBalance: input.currentBalance.toString(),
          availableCredit: availableCredit.toString(),
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        bankName: z.string().optional(),
        lastFourDigits: z.string().optional(),
        creditLimit: z.number().optional(),
        currentBalance: z.number().optional(),
        closingDay: z.number().optional(),
        paymentDueDay: z.number().optional(),
        currency: z.string().optional(),
        color: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const updateData: any = { ...updates };
        
        if (updates.creditLimit !== undefined) {
          updateData.creditLimit = updates.creditLimit.toString();
        }
        if (updates.currentBalance !== undefined) {
          updateData.currentBalance = updates.currentBalance.toString();
        }
        if (updates.creditLimit !== undefined || updates.currentBalance !== undefined) {
          const card = await db.getCreditCardById(id, ctx.user.id);
          if (card) {
            const limit = updates.creditLimit !== undefined ? updates.creditLimit : Number(card.creditLimit);
            const balance = updates.currentBalance !== undefined ? updates.currentBalance : Number(card.currentBalance);
            updateData.availableCredit = (limit - balance).toString();
          }
        }
        
        await db.updateCreditCard(id, ctx.user.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCreditCard(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Categories router
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getAllCategoriesForUser(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["income", "expense"]),
        color: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createCategory({
          userId: ctx.user.id,
          ...input,
          isDefault: false,
        });
      }),

    initializeDefaults: protectedProcedure
      .mutation(async ({ ctx }) => {
        const existingCategories = await db.getDefaultCategories();
        if (existingCategories.length > 0) {
          return { message: "Default categories already exist" };
        }

        const defaultCategories = getDefaultCategoryData();
        for (const category of defaultCategories) {
          await db.createCategory({
            ...category,
            userId: null,
          });
        }

        return { message: "Default categories initialized successfully" };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCategory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Transactions router
  transactions: router({
    list: protectedProcedure
      .input(z.object({
        accountId: z.number().optional(),
        creditCardId: z.number().optional(),
        categoryId: z.number().optional(),
        type: z.enum(["income", "expense"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (input?.startDate && input?.endDate) {
          return db.getTransactionsByDateRange(ctx.user.id, input.startDate, input.endDate);
        }
        if (input?.accountId) {
          return db.getTransactionsByAccount(ctx.user.id, input.accountId);
        }
        if (input?.creditCardId) {
          return db.getTransactionsByCreditCard(ctx.user.id, input.creditCardId);
        }
        if (input?.categoryId) {
          return db.getTransactionsByCategory(ctx.user.id, input.categoryId);
        }
        return db.getTransactionsByUserId(ctx.user.id);
      }),

    recent: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        return db.getTransactionsByUserId(ctx.user.id, input.limit);
      }),

    summary: protectedProcedure.query(async ({ ctx }) => {
      const transactions = await db.getTransactionsByUserId(ctx.user.id);
      const categories = await db.getAllCategoriesForUser(ctx.user.id);
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const currentMonthTransactions = transactions.filter((tx: any) => {
        const txDate = new Date(tx.transactionDate);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      });

      const totalIncome = currentMonthTransactions
        .filter((tx: any) => tx.type === "income")
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

      const totalExpenses = currentMonthTransactions
        .filter((tx: any) => tx.type === "expense")
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

      // Group by category
      const byCategory = categories.map((cat: any) => {
        const categoryTransactions = currentMonthTransactions.filter(
          (tx: any) => tx.categoryId === cat.id && tx.type === "expense"
        );
        const total = categoryTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color,
          total,
        };
      }).filter((item: any) => item.total > 0);

      // Group by month (last 6 months)
      const byMonth = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const month = date.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
        const monthTransactions = transactions.filter((tx: any) => {
          const txDate = new Date(tx.transactionDate);
          return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
        });

        const income = monthTransactions
          .filter((tx: any) => tx.type === "income")
          .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

        const expenses = monthTransactions
          .filter((tx: any) => tx.type === "expense")
          .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

        byMonth.push({ month, income, expenses });
      }

      return {
        totalIncome,
        totalExpenses,
        byCategory,
        byMonth,
      };
    }),

    create: protectedProcedure
      .input(z.object({
        accountId: z.number().optional(),
        creditCardId: z.number().optional(),
        categoryId: z.number().optional(),
        type: z.enum(["income", "expense"]),
        amount: z.number(),
        description: z.string(),
        transactionDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createTransaction({
          userId: ctx.user.id,
          ...input,
          amount: input.amount.toString(),
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        accountId: z.number().optional(),
        creditCardId: z.number().optional(),
        categoryId: z.number().optional(),
        type: z.enum(["income", "expense"]).optional(),
        amount: z.number().optional(),
        description: z.string().optional(),
        transactionDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const updateData: any = { ...updates };
        if (updates.amount !== undefined) {
          updateData.amount = updates.amount.toString();
        }
        await db.updateTransaction(id, ctx.user.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTransaction(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Admin router
  admin: router({
    clearAllData: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("No tienes permiso para limpiar datos");
        }

        try {
          // Solo limpiar transacciones, no cuentas ni tarjetas
          const transactions = await db.getTransactionsByUserId(ctx.user.id);
          for (const tx of transactions) {
            await db.deleteTransaction(tx.id, ctx.user.id);
          }

          return { success: true, message: "Todas las transacciones han sido eliminadas" };
        } catch (error) {
          throw new Error(`Error al limpiar transacciones: ${error instanceof Error ? error.message : String(error)}`);
        }
      }),
  }),

  // File upload and processing router
  files: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUploadedFilesByUserId(ctx.user.id);
    }),

    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.enum(["pdf", "image"]),
        fileData: z.string(), // base64 encoded
        accountId: z.number().optional(),
        creditCardId: z.number().optional(),
        accountType: z.enum(["bank", "credit_card"]).default("bank"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `${ctx.user.id}/statements/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.fileType === "pdf" ? "application/pdf" : "image/jpeg");

        // Create file record
        const uploadedFile = await db.createUploadedFile({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileType: input.fileType,
          fileUrl: url,
          fileKey,
          fileSize: buffer.length,
          processingStatus: "pending",
        });

        // Process file asynchronously (in background)
        (async () => {
          try {
            await db.updateUploadedFile(uploadedFile.id, ctx.user.id, { processingStatus: "processing" });

            // Extract text
            const extractedText = await processFile(url, input.fileType);
            await db.updateUploadedFile(uploadedFile.id, ctx.user.id, { extractedText });

            // Parse transactions
            const parsedTransactions = await parseStatementText(extractedText, input.accountType);

            // Get available categories
            const categories = await db.getAllCategoriesForUser(ctx.user.id);

            // Create transactions with AI categorization
            let createdCount = 0;
            for (const tx of parsedTransactions) {
              const categorization = await categorizeTransaction(tx.description, tx.amount, categories);

              await db.createTransaction({
                userId: ctx.user.id,
                accountId: input.accountId,
                creditCardId: input.creditCardId,
                categoryId: categorization.categoryId,
                type: tx.type,
                amount: tx.amount.toString(),
                description: tx.description,
                transactionDate: new Date(tx.date),
                fileUrl: url,
                fileKey,
              });
              createdCount++;
            }

            await db.updateUploadedFile(uploadedFile.id, ctx.user.id, {
              processingStatus: "completed",
              transactionsCount: createdCount,
              processedAt: new Date(),
            });
          } catch (error) {
            await db.updateUploadedFile(uploadedFile.id, ctx.user.id, {
              processingStatus: "failed",
              errorMessage: error instanceof Error ? error.message : String(error),
            });
          }
        })();

        return uploadedFile;
      }),
   }),


});
export type AppRouter = typeof appRouter;
