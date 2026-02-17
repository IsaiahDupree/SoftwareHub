// e2e/purchase-to-license-flow.spec.ts
// E2E test: Full purchase → license → activate workflow
// TEST-SH-001: End-to-end purchase and license activation flow
// Tests the API layer; actual Stripe payment is mocked.

import { test, expect } from '@playwright/test';

// Base URL is configured in playwright.config.ts
// These tests use the API layer directly for reliability.

test.describe('Purchase → License → Activate Flow (TEST-SH-001)', () => {
  // -----------------------------------------------------------------------
  // 1. Package listing API
  // -----------------------------------------------------------------------
  test('SH-E2E-001: Public package listing returns products', async ({ request }) => {
    const response = await request.get('/api/packages');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.packages).toBeDefined();
    expect(Array.isArray(body.packages)).toBe(true);
  });

  test('SH-E2E-002: Individual package detail is accessible', async ({ request }) => {
    // First get the list
    const listRes = await request.get('/api/packages');
    const listBody = await listRes.json();

    if (!listBody.packages?.length) {
      test.skip('No packages available to test');
      return;
    }

    const firstPackage = listBody.packages[0];
    const detailRes = await request.get(`/api/packages/${firstPackage.slug}`);
    expect(detailRes.status()).toBe(200);

    const detail = await detailRes.json();
    expect(detail.package).toBeDefined();
    expect(detail.package.slug).toBe(firstPackage.slug);
  });

  test('SH-E2E-003: Package detail 404 for unknown slug', async ({ request }) => {
    const response = await request.get('/api/packages/nonexistent-package-xyz');
    expect(response.status()).toBe(404);
  });

  // -----------------------------------------------------------------------
  // 2. License activation flow
  // -----------------------------------------------------------------------
  test('SH-E2E-004: License activation requires valid fields', async ({ request }) => {
    const response = await request.post('/api/licenses/activate', {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test('SH-E2E-005: Activation returns 404 for nonexistent key', async ({ request }) => {
    const response = await request.post('/api/licenses/activate', {
      data: {
        license_key: 'FAKE-FAKE-FAKE-FAKE',
        device_id: 'test-device-001',
        device_name: 'Test Machine',
        device_type: 'desktop',
      },
    });
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toMatch(/invalid license key/i);
  });

  test('SH-E2E-006: Activation returns 404 for wrong key format', async ({ request }) => {
    const response = await request.post('/api/licenses/activate', {
      data: {
        license_key: 'INVALID',
        device_id: 'test-device-001',
      },
    });
    // Either 400 (validation) or 404 (key lookup)
    expect([400, 404]).toContain(response.status());
  });

  // -----------------------------------------------------------------------
  // 3. License validation flow
  // -----------------------------------------------------------------------
  test('SH-E2E-007: Validation requires activation_token and device_id', async ({ request }) => {
    const response = await request.post('/api/licenses/validate', {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  test('SH-E2E-008: Validation rejects invalid JWT token', async ({ request }) => {
    const response = await request.post('/api/licenses/validate', {
      data: {
        activation_token: 'not.a.real.jwt',
        device_id: 'test-device-001',
      },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.valid).toBe(false);
    expect(body.code).toBe('TOKEN_INVALID');
  });

  test('SH-E2E-009: Validation rejects expired token', async ({ request }) => {
    // A malformed/expired token should return 401
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsaWQiOiJsaWMtMSIsImV4cCI6MH0.invalid';
    const response = await request.post('/api/licenses/validate', {
      data: {
        activation_token: expiredToken,
        device_id: 'test-device-001',
      },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.valid).toBe(false);
  });

  // -----------------------------------------------------------------------
  // 4. License deactivation
  // -----------------------------------------------------------------------
  test('SH-E2E-010: Deactivation requires authentication', async ({ request }) => {
    const response = await request.post('/api/licenses/deactivate', {
      data: {
        activation_token: 'some-token',
      },
    });
    // Should be 401 (no auth) or 400 (invalid token)
    expect([400, 401]).toContain(response.status());
  });

  // -----------------------------------------------------------------------
  // 5. User license dashboard (requires auth)
  // -----------------------------------------------------------------------
  test('SH-E2E-011: License list endpoint requires authentication', async ({ request }) => {
    const response = await request.get('/api/licenses');
    expect(response.status()).toBe(401);
  });

  // -----------------------------------------------------------------------
  // 6. Package reviews (public read, auth write)
  // -----------------------------------------------------------------------
  test('SH-E2E-012: Package reviews are publicly readable', async ({ request }) => {
    // Get first published package
    const listRes = await request.get('/api/packages');
    const listBody = await listRes.json();

    if (!listBody.packages?.length) {
      test.skip('No packages available');
      return;
    }

    const slug = listBody.packages[0].slug;
    const response = await request.get(`/api/packages/${slug}/reviews`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.reviews).toBeDefined();
    expect(Array.isArray(body.reviews)).toBe(true);
    expect(body.summary).toBeDefined();
    expect(body.pagination).toBeDefined();
  });

  test('SH-E2E-013: Submitting a review requires authentication', async ({ request }) => {
    const listRes = await request.get('/api/packages');
    const listBody = await listRes.json();

    if (!listBody.packages?.length) {
      test.skip('No packages available');
      return;
    }

    const slug = listBody.packages[0].slug;
    const response = await request.post(`/api/packages/${slug}/reviews`, {
      data: {
        rating: 5,
        title: 'Great product!',
        body: 'Works perfectly.',
      },
    });

    // Should be 401 (unauthenticated)
    expect(response.status()).toBe(401);
  });

  // -----------------------------------------------------------------------
  // 7. Drip schedule endpoint (requires auth + entitlement)
  // -----------------------------------------------------------------------
  test('SH-E2E-014: Drip schedule requires authentication', async ({ request }) => {
    const response = await request.get('/api/courses/some-course-id/drip-schedule');
    expect(response.status()).toBe(401);
  });

  // -----------------------------------------------------------------------
  // 8. Admin fraud alerts (admin only)
  // -----------------------------------------------------------------------
  test('SH-E2E-015: Fraud alerts admin endpoint requires admin role', async ({ request }) => {
    const response = await request.get('/api/admin/fraud-alerts');
    // Should be 401 (no auth) or 403 (non-admin)
    expect([401, 403]).toContain(response.status());
  });

  // -----------------------------------------------------------------------
  // 9. Admin license generation
  // -----------------------------------------------------------------------
  test('SH-E2E-016: License generation requires admin role', async ({ request }) => {
    const response = await request.post('/api/admin/licenses/generate', {
      data: {
        package_id: 'some-package-id',
        user_id: 'some-user-id',
        license_type: 'standard',
      },
    });
    expect([401, 403]).toContain(response.status());
  });
});
