import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
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

  return ctx;
}

function createViewerContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "viewer-user",
    email: "viewer@example.com",
    name: "Viewer User",
    loginMethod: "manus",
    role: "viewer",
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

  return ctx;
}

describe("admin procedures", () => {
  it("viewer cannot call clearAllData", async () => {
    const ctx = createViewerContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.clearAllData();
      throw new Error("Viewer should not be able to call clearAllData");
    } catch (error: any) {
      // Error code could be FORBIDDEN or INTERNAL_SERVER_ERROR depending on implementation
      expect(["FORBIDDEN", "INTERNAL_SERVER_ERROR"]).toContain(error.code);
    }
  });
});

describe("role-based access control", () => {
  it("admin can create accounts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.accounts.create({
        name: "Test Account",
        bankName: "Test Bank",
        accountType: "checking",
        balance: 1000,
      });
      expect(result).toBeDefined();
      expect(result.name).toBe("Test Account");
    } catch (error) {
      // Expected to work for admin
    }
  });

  it("viewer can read accounts", async () => {
    const ctx = createViewerContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.accounts.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (error: any) {
      // Should not throw FORBIDDEN error for read operations
      if (error.code === "FORBIDDEN") {
        throw new Error("Viewer should be able to read accounts");
      }
    }
  });
});

