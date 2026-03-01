/**
 * Regression Test: Bug #001
 *
 * Bug Description:
 * Stripe webhook events were being processed without signature validation,
 * allowing potential replay attacks or forged webhook events.
 *
 * Root Cause:
 * Missing signature verification using stripe.webhooks.constructEvent()
 * before processing webhook payload.
 *
 * Fixed In:
 * Commit: abc123def (hypothetical)
 * Date: 2026-02-15
 *
 * Test Coverage:
 * - Rejects webhooks with missing signature header
 * - Rejects webhooks with invalid signature
 * - Accepts webhooks with valid signature
 * - Prevents replay attacks with old signatures
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/stripe/webhook/route";

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn((payload, signature, secret) => {
        if (!signature) {
          throw new Error("No signature provided");
        }
        if (signature === "invalid_signature") {
          throw new Error("Invalid signature");
        }
        if (signature === "old_signature") {
          throw new Error("Timestamp outside tolerance");
        }
        // Valid signature
        return {
          type: "checkout.session.completed",
          data: { object: { id: "cs_test_123" } },
        };
      }),
    },
  }));
});

describe("Bug #001: Stripe Webhook Signature Validation", () => {
  it("should reject webhooks without signature header", async () => {
    const mockRequest = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({ type: "test" }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("signature");
  });

  it("should reject webhooks with invalid signature", async () => {
    const mockRequest = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "invalid_signature",
      },
      body: JSON.stringify({ type: "test" }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("signature");
  });

  it("should reject webhooks with old signatures (replay protection)", async () => {
    const mockRequest = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "old_signature",
      },
      body: JSON.stringify({ type: "test" }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("Timestamp");
  });

  it("should accept webhooks with valid signature", async () => {
    const mockRequest = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "valid_signature_t=123456,v1=abc123",
      },
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { id: "cs_test_123" } },
      }),
    });

    const response = await POST(mockRequest);

    // Should be processed (200) or queued (202), not rejected (400)
    expect([200, 202]).toContain(response.status);
  });

  it("should validate signature before processing any event logic", async () => {
    // This test ensures signature validation happens FIRST
    // Even if the event type is valid, bad signature should fail
    const mockRequest = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "invalid_signature",
      },
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_malicious_123",
            customer: "cus_attacker",
            metadata: { user_id: "admin-user-id" },
          },
        },
      }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);

    // The event should NOT have been processed
    // (This would be verified by checking database, but we're testing the guard)
  });
});
