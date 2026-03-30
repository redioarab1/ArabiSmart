import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generateOpenId, generateResetToken } from "./localAuth";

describe("localAuth helpers", () => {
  it("hashPassword should produce a bcrypt hash", async () => {
    const hash = await hashPassword("MySecretPass123");
    expect(hash).toBeTruthy();
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toBe("MySecretPass123");
  });

  it("verifyPassword should return true for correct password", async () => {
    const password = "TestPassword@2025";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("verifyPassword should return false for wrong password", async () => {
    const hash = await hashPassword("CorrectPassword");
    const result = await verifyPassword("WrongPassword", hash);
    expect(result).toBe(false);
  });

  it("generateOpenId should produce unique IDs with local_ prefix", () => {
    const id1 = generateOpenId("ahmed");
    const id2 = generateOpenId("ahmed");
    expect(id1).toMatch(/^local_ahmed_/);
    expect(id2).toMatch(/^local_ahmed_/);
    // Should be unique (nanoid suffix)
    expect(id1).not.toBe(id2);
  });

  it("generateResetToken should produce a token of sufficient length", () => {
    const token = generateResetToken();
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it("different passwords should produce different hashes", async () => {
    const hash1 = await hashPassword("password123");
    const hash2 = await hashPassword("password123");
    // bcrypt uses random salt, so same password → different hashes
    expect(hash1).not.toBe(hash2);
    // But both should verify correctly
    expect(await verifyPassword("password123", hash1)).toBe(true);
    expect(await verifyPassword("password123", hash2)).toBe(true);
  });
});
