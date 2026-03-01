/**
 * Mock Service Layer for Testing
 *
 * Provides mock implementations of external services:
 * - Auth (Supabase)
 * - DB (Supabase)
 * - Payment (Stripe)
 * - Email (Resend)
 */

import type { User } from "@supabase/supabase-js";

// ============================================================================
// AUTH SERVICE MOCKS
// ============================================================================

export const mockUser: User = {
  id: "test-user-id-123",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
};

export const mockAuthService = {
  getUser: jest.fn().mockResolvedValue({
    data: { user: mockUser },
    error: null,
  }),

  signIn: jest.fn().mockResolvedValue({
    data: { user: mockUser, session: { access_token: "mock-token" } },
    error: null,
  }),

  signOut: jest.fn().mockResolvedValue({
    error: null,
  }),

  signInWithOtp: jest.fn().mockResolvedValue({
    error: null,
  }),

  resetPassword: jest.fn().mockResolvedValue({
    error: null,
  }),

  updateUser: jest.fn().mockResolvedValue({
    data: { user: mockUser },
    error: null,
  }),

  getSession: jest.fn().mockResolvedValue({
    data: { session: { access_token: "mock-token" } },
    error: null,
  }),

  // Helper to simulate auth errors
  simulateError: (errorMessage: string) => {
    mockAuthService.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: errorMessage },
    });
  },

  // Helper to simulate unauthenticated state
  simulateUnauthenticated: () => {
    mockAuthService.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
  },

  reset: () => {
    // Clear all mock calls and reset to default implementations
    mockAuthService.getUser.mockReset().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockAuthService.signIn.mockReset().mockResolvedValue({
      data: { user: mockUser, session: { access_token: "mock-token" } },
      error: null,
    });
    mockAuthService.signOut.mockReset().mockResolvedValue({
      error: null,
    });
    mockAuthService.signInWithOtp.mockReset().mockResolvedValue({
      error: null,
    });
    mockAuthService.resetPassword.mockReset().mockResolvedValue({
      error: null,
    });
    mockAuthService.updateUser.mockReset().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockAuthService.getSession.mockReset().mockResolvedValue({
      data: { session: { access_token: "mock-token" } },
      error: null,
    });
  },
};

// ============================================================================
// DATABASE SERVICE MOCKS
// ============================================================================

export const mockDbService = {
  // Generic query builder mock
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),

  // Predefined table-specific mocks
  courses: {
    findById: jest.fn().mockResolvedValue({
      id: "course-123",
      title: "Test Course",
      slug: "test-course",
      status: "published",
    }),
    findAll: jest.fn().mockResolvedValue([
      { id: "course-123", title: "Test Course 1" },
      { id: "course-456", title: "Test Course 2" },
    ]),
    create: jest.fn().mockResolvedValue({
      id: "course-new",
      title: "New Course",
    }),
  },

  packages: {
    findById: jest.fn().mockResolvedValue({
      package_id: "pkg-123",
      name: "Test Package",
      slug: "test-package",
      status: "operational",
    }),
    findAll: jest.fn().mockResolvedValue([
      { package_id: "pkg-123", name: "Test Package 1" },
      { package_id: "pkg-456", name: "Test Package 2" },
    ]),
  },

  licenses: {
    findByKey: jest.fn().mockResolvedValue({
      id: "license-123",
      license_key: "TEST-1234-5678-ABCD-EFGH",
      status: "active",
      type: "pro",
    }),
    findByUser: jest.fn().mockResolvedValue([
      { id: "license-123", package_id: "pkg-123", status: "active" },
    ]),
  },

  enrollments: {
    findByUser: jest.fn().mockResolvedValue([
      { id: "enroll-123", course_id: "course-123", enrolled_at: new Date().toISOString() },
    ]),
    create: jest.fn().mockResolvedValue({
      id: "enroll-new",
      user_id: "user-123",
      course_id: "course-123",
    }),
  },

  // Helper to simulate DB errors
  simulateError: (table: string, operation: string, errorMessage: string) => {
    const mockChain = {
      ...mockDbService.from(table),
      [operation === "single" ? "single" : operation]: jest.fn().mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      }),
    };
    mockDbService.from.mockReturnValueOnce(mockChain);
  },

  reset: () => {
    mockDbService.from.mockClear();
    Object.values(mockDbService.courses).forEach(fn => fn.mockClear?.());
    Object.values(mockDbService.packages).forEach(fn => fn.mockClear?.());
    Object.values(mockDbService.licenses).forEach(fn => fn.mockClear?.());
    Object.values(mockDbService.enrollments).forEach(fn => fn.mockClear?.());
  },
};

// ============================================================================
// PAYMENT SERVICE MOCKS (Stripe)
// ============================================================================

export const mockPaymentService = {
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/test",
        payment_status: "unpaid",
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: "cs_test_123",
        payment_status: "paid",
        customer: "cus_test_123",
      }),
    },
  },

  customers: {
    create: jest.fn().mockResolvedValue({
      id: "cus_test_123",
      email: "customer@example.com",
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: "cus_test_123",
      email: "customer@example.com",
      subscriptions: { data: [] },
    }),
  },

  subscriptions: {
    create: jest.fn().mockResolvedValue({
      id: "sub_test_123",
      status: "active",
      current_period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: "sub_test_123",
      status: "active",
    }),
    cancel: jest.fn().mockResolvedValue({
      id: "sub_test_123",
      status: "canceled",
    }),
  },

  webhooks: {
    constructEvent: jest.fn((payload, signature, secret) => ({
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          customer: "cus_test_123",
          metadata: {},
        },
      },
    })),
  },

  prices: {
    retrieve: jest.fn().mockResolvedValue({
      id: "price_test_123",
      unit_amount: 4900,
      currency: "usd",
    }),
  },

  // Helper to simulate payment errors
  simulateError: (method: string, errorMessage: string) => {
    const error = new Error(errorMessage);
    (error as any).type = "StripeCardError";

    if (method === "checkout.sessions.create") {
      mockPaymentService.checkout.sessions.create.mockRejectedValueOnce(error);
    }
  },

  reset: () => {
    mockPaymentService.checkout.sessions.create.mockClear();
    mockPaymentService.checkout.sessions.retrieve.mockClear();
    mockPaymentService.customers.create.mockClear();
    mockPaymentService.subscriptions.create.mockClear();
    mockPaymentService.webhooks.constructEvent.mockClear();
  },
};

// ============================================================================
// EMAIL SERVICE MOCKS (Resend)
// ============================================================================

export const mockEmailService = {
  send: jest.fn().mockResolvedValue({
    id: "email-test-123",
    from: "noreply@example.com",
    to: "recipient@example.com",
    created_at: new Date().toISOString(),
  }),

  sendBatch: jest.fn().mockResolvedValue({
    data: [
      { id: "email-1" },
      { id: "email-2" },
    ],
  }),

  // Template emails
  sendWelcomeEmail: jest.fn().mockResolvedValue({
    id: "email-welcome-123",
  }),

  sendPurchaseConfirmation: jest.fn().mockResolvedValue({
    id: "email-purchase-123",
  }),

  sendPasswordReset: jest.fn().mockResolvedValue({
    id: "email-reset-123",
  }),

  sendLicenseKey: jest.fn().mockResolvedValue({
    id: "email-license-123",
  }),

  // Helper to simulate email errors
  simulateError: (errorMessage: string) => {
    mockEmailService.send.mockRejectedValueOnce(new Error(errorMessage));
  },

  reset: () => {
    mockEmailService.send.mockClear();
    mockEmailService.sendBatch.mockClear();
    mockEmailService.sendWelcomeEmail.mockClear();
    mockEmailService.sendPurchaseConfirmation.mockClear();
  },
};

// ============================================================================
// RESET ALL MOCKS
// ============================================================================

export function resetAllMocks() {
  mockAuthService.reset();
  mockDbService.reset();
  mockPaymentService.reset();
  mockEmailService.reset();
}
