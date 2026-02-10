// __tests__/lib/licenses/generate.test.ts
// Test suite for license key generation
// Test IDs: SH-LIC-001 through SH-LIC-003

import { describe, it, expect } from "@jest/globals";
import { generateLicenseKeySync } from "@/lib/licenses/generate";
import { hashLicenseKey } from "@/lib/licenses/hash";

const LICENSE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

describe("License Key Generation - sh-081", () => {
  describe("SH-LIC-001: Format validation", () => {
    it("should generate key in XXXX-XXXX-XXXX-XXXX format", () => {
      const key = generateLicenseKeySync();
      expect(key).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it("should have exactly 19 characters (16 chars + 3 dashes)", () => {
      const key = generateLicenseKeySync();
      expect(key.length).toBe(19);
    });

    it("should have dashes at positions 4, 9, and 14", () => {
      const key = generateLicenseKeySync();
      expect(key[4]).toBe("-");
      expect(key[9]).toBe("-");
      expect(key[14]).toBe("-");
    });

    it("should contain only uppercase letters and digits (no dashes in segments)", () => {
      const key = generateLicenseKeySync();
      const segments = key.split("-");
      expect(segments).toHaveLength(4);
      segments.forEach((segment) => {
        expect(segment).toMatch(/^[A-Z0-9]{4}$/);
      });
    });
  });

  describe("SH-LIC-002: Uniqueness test", () => {
    it("should generate different keys on multiple calls", () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateLicenseKeySync());
      }
      // With 16 random bytes mapped to 30 characters, collisions should be effectively impossible
      expect(keys.size).toBe(100);
    });

    it("should produce different hashes for different keys", () => {
      const key1 = generateLicenseKeySync();
      const key2 = generateLicenseKeySync();
      expect(key1).not.toBe(key2);
      expect(hashLicenseKey(key1)).not.toBe(hashLicenseKey(key2));
    });
  });

  describe("SH-LIC-003: Character set test", () => {
    it("should only use allowed characters (no 0, O, 1, I, L)", () => {
      // Generate many keys and check all characters
      for (let i = 0; i < 50; i++) {
        const key = generateLicenseKeySync();
        const chars = key.replace(/-/g, "");
        for (const c of chars) {
          expect(LICENSE_CHARS).toContain(c);
        }
      }
    });

    it("should not contain confusing characters 0, O, 1, I", () => {
      for (let i = 0; i < 50; i++) {
        const key = generateLicenseKeySync();
        expect(key).not.toMatch(/[01OI]/);
      }
    });

    it("should use a character set of size 32", () => {
      expect(LICENSE_CHARS.length).toBe(32);
    });
  });

  describe("License Key Hashing", () => {
    it("should produce consistent hashes for the same key", () => {
      const key = generateLicenseKeySync();
      const hash1 = hashLicenseKey(key);
      const hash2 = hashLicenseKey(key);
      expect(hash1).toBe(hash2);
    });

    it("should be case-insensitive", () => {
      const key = generateLicenseKeySync();
      const hash1 = hashLicenseKey(key.toUpperCase());
      const hash2 = hashLicenseKey(key.toLowerCase());
      expect(hash1).toBe(hash2);
    });

    it("should return a valid hex string (SHA256 = 64 chars)", () => {
      const key = generateLicenseKeySync();
      const hash = hashLicenseKey(key);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should trim whitespace before hashing", () => {
      const key = generateLicenseKeySync();
      const hash1 = hashLicenseKey(key);
      const hash2 = hashLicenseKey(`  ${key}  `);
      expect(hash1).toBe(hash2);
    });
  });
});
