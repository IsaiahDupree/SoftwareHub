// __tests__/lib/licenses/fraud.test.ts
// Unit tests for license fraud detection logic
// TEST-SH-002: License validation edge cases

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── Mock setup ──────────────────────────────────────────────────────────────
// We must set up mocks BEFORE importing the module under test

const insertMock = jest.fn().mockResolvedValue({ error: null });
const notMock = jest.fn().mockResolvedValue({ count: 0, data: [] });
const gteMock = jest.fn().mockReturnValue({ not: notMock });
const eqMock = jest.fn().mockReturnValue({ gte: gteMock, single: jest.fn() });
const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
const fromMock = jest.fn().mockReturnValue({
  select: selectMock,
  insert: insertMock,
});

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

// Now import the module under test
import { checkForFraud, recordFraudAlert } from '@/lib/licenses/fraud';

describe('License Fraud Detection - LIC-006', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all mocks to safe defaults
    notMock.mockResolvedValue({ count: 0, data: [] });
    gteMock.mockReturnValue({ not: notMock });

    const baseChain = {
      select: selectMock,
      insert: insertMock,
      eq: eqMock,
      gte: gteMock,
      not: notMock,
    };

    eqMock.mockReturnValue({ ...baseChain, gte: gteMock, single: jest.fn() });
    selectMock.mockReturnValue({ eq: eqMock });
    insertMock.mockResolvedValue({ error: null });
    fromMock.mockReturnValue(baseChain);
  });

  describe('checkForFraud', () => {
    it('returns low risk for normal usage', async () => {
      notMock.mockResolvedValue({ count: 0, data: [] });

      const result = await checkForFraud('lic-1', '1.2.3.4', 'device-abc');

      expect(result.suspicious).toBe(false);
      expect(result.riskScore).toBe(0);
      expect(result.action).toBe('allow');
      expect(result.reasons).toHaveLength(0);
    });

    it('returns action=allow for riskScore < 30', async () => {
      notMock.mockResolvedValue({ count: 0, data: [] });

      const result = await checkForFraud('lic-1', null, null);

      expect(result.action).toBe('allow');
      expect(result.riskScore).toBeLessThan(30);
    });

    it('handles null IP address gracefully', async () => {
      notMock.mockResolvedValue({ count: 0, data: [] });

      const result = await checkForFraud('lic-1', null, 'device-abc');

      expect(result).toBeDefined();
      expect(result.suspicious).toBe(false);
    });

    it('returns allow on database errors (non-blocking)', async () => {
      notMock.mockRejectedValue(new Error('DB connection error'));

      const result = await checkForFraud('lic-1', '1.2.3.4', 'device-abc');

      expect(result.suspicious).toBe(false);
      expect(result.action).toBe('allow');
    });

    it('risk score starts at 0 with no anomalies', async () => {
      notMock.mockResolvedValue({ count: 0, data: [] });

      const result = await checkForFraud('lic-2', '2.3.4.5', 'device-xyz');
      expect(result.riskScore).toBe(0);
    });
  });

  describe('FraudCheckResult structure', () => {
    it('returns all required fields', async () => {
      notMock.mockResolvedValue({ count: 0, data: [] });

      const result = await checkForFraud('lic-1', '1.2.3.4', 'device-1');

      expect(result).toHaveProperty('suspicious');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('action');
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(['allow', 'flag', 'block']).toContain(result.action);
    });

    it('action is allow when riskScore is 0', async () => {
      notMock.mockResolvedValue({ count: 0, data: [] });
      const result = await checkForFraud('lic-1', '1.2.3.4', 'device-1');
      expect(result.action).toBe('allow');
    });
  });

  describe('recordFraudAlert', () => {
    it('does not throw on successful insert', async () => {
      fromMock.mockReturnValue({ insert: insertMock });
      insertMock.mockResolvedValue({ error: null });

      await expect(
        recordFraudAlert({
          license_id: 'lic-1',
          user_id: 'user-1',
          alert_type: 'ip_abuse',
          risk_score: 75,
          details: { reasons: ['High activation rate'] },
          ip_address: '1.2.3.4',
        })
      ).resolves.toBeUndefined();
    });

    it('handles null user_id and ip_address without throwing', async () => {
      fromMock.mockReturnValue({ insert: insertMock });
      insertMock.mockResolvedValue({ error: null });

      await expect(
        recordFraudAlert({
          license_id: 'lic-2',
          user_id: null,
          alert_type: 'hammering',
          risk_score: 50,
          details: {},
          ip_address: null,
        })
      ).resolves.toBeUndefined();
    });

    it('does not throw on database error', async () => {
      fromMock.mockReturnValue({ insert: insertMock });
      insertMock.mockRejectedValue(new Error('DB error'));

      await expect(
        recordFraudAlert({
          license_id: 'lic-3',
          user_id: null,
          alert_type: 'rapid_activations',
          risk_score: 40,
          details: {},
          ip_address: '9.9.9.9',
        })
      ).resolves.toBeUndefined();
    });
  });
});
