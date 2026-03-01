/**
 * Regression Test: Bug #002
 *
 * Bug Description:
 * License key generation occasionally produced duplicate keys when
 * multiple licenses were created in rapid succession, causing database
 * unique constraint violations.
 *
 * Root Cause:
 * Random key generation used Date.now() as seed, which is not unique
 * when multiple requests arrive in the same millisecond. Needed to use
 * crypto.randomUUID() or ensure uniqueness check before insertion.
 *
 * Fixed In:
 * Commit: ghi789jkl (hypothetical)
 * Date: 2026-02-25
 *
 * Test Coverage:
 * - Generate multiple license keys rapidly
 * - Verify all keys are unique
 * - Test concurrent key generation
 * - Verify keys match expected format
 * - Ensure keys are cryptographically random
 */

import { generateLicenseKey, validateLicenseKeyFormat } from "@/lib/licenses/generator";

describe("Bug #002: License Key Uniqueness", () => {
  it("should generate unique license keys for sequential requests", () => {
    const keys = new Set<string>();
    const count = 100;

    for (let i = 0; i < count; i++) {
      const key = generateLicenseKey("test-package");
      expect(keys.has(key)).toBe(false); // Should not exist yet
      keys.add(key);
    }

    expect(keys.size).toBe(count);
  });

  it("should generate unique license keys for rapid concurrent requests", async () => {
    const promises = Array.from({ length: 50 }, () =>
      Promise.resolve(generateLicenseKey("test-package"))
    );

    const keys = await Promise.all(promises);
    const uniqueKeys = new Set(keys);

    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("should generate keys in the correct format", () => {
    const key = generateLicenseKey("watermark-remover");

    // Format: PREFIX-XXXX-XXXX-XXXX-XXXX
    const pattern = /^[A-Z0-9]+-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    expect(key).toMatch(pattern);
  });

  it("should use the correct prefix for each package", () => {
    const wrKey = generateLicenseKey("watermark-remover");
    const ttsKey = generateLicenseKey("tts-studio");

    expect(wrKey).toMatch(/^WATERMARK/);
    expect(ttsKey).toMatch(/^TTS/);
  });

  it("should generate keys with sufficient entropy", () => {
    const keys = Array.from({ length: 10 }, () =>
      generateLicenseKey("test-package")
    );

    // Extract the random parts (excluding prefix)
    const randomParts = keys.map(key => key.split("-").slice(1).join(""));

    // No two should be similar (Hamming distance check)
    for (let i = 0; i < randomParts.length; i++) {
      for (let j = i + 1; j < randomParts.length; j++) {
        const part1 = randomParts[i];
        const part2 = randomParts[j];

        let differences = 0;
        for (let k = 0; k < Math.min(part1.length, part2.length); k++) {
          if (part1[k] !== part2[k]) differences++;
        }

        // At least 50% of characters should differ
        expect(differences).toBeGreaterThan(part1.length / 2);
      }
    }
  });

  it("should validate license key format correctly", () => {
    const validKey = "TEST-ABCD-1234-EFGH-5678";
    expect(validateLicenseKeyFormat(validKey)).toBe(true);

    const invalidKeys = [
      "INVALID",                          // Too short
      "TEST-ABCD-123-EFGH-5678",         // Wrong segment length
      "TEST-ABCD-1234-EFGH",             // Missing segment
      "test-abcd-1234-efgh-5678",        // Lowercase
      "TEST-ABCD-1234-EFGH-5678-EXTRA",  // Too many segments
    ];

    invalidKeys.forEach(key => {
      expect(validateLicenseKeyFormat(key)).toBe(false);
    });
  });

  it("should not generate predictable sequences", () => {
    const key1 = generateLicenseKey("test");
    const key2 = generateLicenseKey("test");
    const key3 = generateLicenseKey("test");

    // Extract numeric parts
    const nums1 = key1.match(/\d+/g) || [];
    const nums2 = key2.match(/\d+/g) || [];
    const nums3 = key3.match(/\d+/g) || [];

    // Should not be sequential (e.g., 1234, 1235, 1236)
    const isSequential =
      nums1.length > 0 &&
      nums1.every((num, i) => {
        const n1 = parseInt(num);
        const n2 = parseInt(nums2[i] || "0");
        return n2 === n1 + 1;
      });

    expect(isSequential).toBe(false);
  });
});
