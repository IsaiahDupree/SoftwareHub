// lib/licenses/fraud.ts
// License fraud detection - anomaly detection for suspicious activation patterns
// LIC-006

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface FraudCheckResult {
  suspicious: boolean;
  reasons: string[];
  riskScore: number; // 0-100
  action: 'allow' | 'flag' | 'block';
}

export interface FraudAlert {
  license_id: string;
  user_id: string | null;
  alert_type: string;
  risk_score: number;
  details: Record<string, unknown>;
  ip_address: string | null;
}

/**
 * Check for suspicious activation/validation patterns.
 * Returns a fraud assessment and recommended action.
 */
export async function checkForFraud(
  licenseId: string,
  ipAddress: string | null,
  deviceId: string | null
): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let riskScore = 0;

  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Check: rapid activations from same IP in last hour
    if (ipAddress) {
      const { count: ipActivationCount } = await supabaseAdmin
        .from('device_activations')
        .select('id', { count: 'exact', head: true })
        .eq('last_ip_address', ipAddress)
        .gte('activated_at', oneHourAgo.toISOString());

      if ((ipActivationCount ?? 0) >= 10) {
        reasons.push(`High activation rate from IP ${ipAddress}: ${ipActivationCount} in 1 hour`);
        riskScore += 40;
      } else if ((ipActivationCount ?? 0) >= 5) {
        reasons.push(`Elevated activation rate from IP ${ipAddress}: ${ipActivationCount} in 1 hour`);
        riskScore += 20;
      }
    }

    // 2. Check: multiple different licenses activated from same IP
    if (ipAddress) {
      const { data: ipLicenses } = await supabaseAdmin
        .from('device_activations')
        .select('license_id')
        .eq('last_ip_address', ipAddress)
        .gte('activated_at', oneDayAgo.toISOString());

      const uniqueLicenses = new Set((ipLicenses ?? []).map((r) => r.license_id)).size;
      if (uniqueLicenses >= 5) {
        reasons.push(`Multiple licenses (${uniqueLicenses}) activated from same IP in 24h`);
        riskScore += 30;
      }
    }

    // 3. Check: license shared across too many IPs in a day
    const { data: licenseIps } = await supabaseAdmin
      .from('device_activations')
      .select('last_ip_address')
      .eq('license_id', licenseId)
      .gte('last_seen_at', oneDayAgo.toISOString())
      .not('last_ip_address', 'is', null);

    const uniqueIps = new Set((licenseIps ?? []).map((r) => r.last_ip_address).filter(Boolean)).size;
    if (uniqueIps >= 8) {
      reasons.push(`License used from ${uniqueIps} distinct IPs in 24h`);
      riskScore += 35;
    } else if (uniqueIps >= 4) {
      reasons.push(`License used from ${uniqueIps} distinct IPs in 24h`);
      riskScore += 15;
    }

    // 4. Check: rapid validation attempts (license hammering)
    const { count: recentValidations } = await supabaseAdmin
      .from('device_activations')
      .select('id', { count: 'exact', head: true })
      .eq('license_id', licenseId)
      .gte('last_validated_at', oneHourAgo.toISOString());

    if ((recentValidations ?? 0) >= 50) {
      reasons.push(`Excessive validations: ${recentValidations} in 1 hour`);
      riskScore += 25;
    }

    // 5. Check: already flagged for fraud previously
    const { count: priorAlerts } = await supabaseAdmin
      .from('license_fraud_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('license_id', licenseId)
      .eq('resolved', false);

    if ((priorAlerts ?? 0) > 0) {
      reasons.push(`License has ${priorAlerts} unresolved fraud alert(s)`);
      riskScore += 20;
    }
  } catch (err) {
    // Don't block on fraud check errors — log and allow
    console.error('[fraud] Error during fraud check:', err);
    return { suspicious: false, reasons: [], riskScore: 0, action: 'allow' };
  }

  const suspicious = riskScore >= 30;
  let action: FraudCheckResult['action'] = 'allow';
  if (riskScore >= 70) action = 'block';
  else if (riskScore >= 30) action = 'flag';

  return { suspicious, reasons, riskScore, action };
}

/**
 * Record a fraud alert in the database.
 */
export async function recordFraudAlert(alert: FraudAlert): Promise<void> {
  try {
    await supabaseAdmin.from('license_fraud_alerts').insert({
      license_id: alert.license_id,
      user_id: alert.user_id,
      alert_type: alert.alert_type,
      risk_score: alert.risk_score,
      details: alert.details,
      ip_address: alert.ip_address,
      resolved: false,
    });
  } catch (err) {
    console.error('[fraud] Failed to record fraud alert:', err);
  }
}

/**
 * Get fraud summary stats for the admin dashboard.
 */
export async function getFraudStats() {
  const [alertsResult, topRiskResult] = await Promise.all([
    supabaseAdmin
      .from('license_fraud_alerts')
      .select('id, alert_type, risk_score, created_at, resolved')
      .order('created_at', { ascending: false })
      .limit(100),

    supabaseAdmin
      .from('license_fraud_alerts')
      .select('license_id, risk_score')
      .eq('resolved', false)
      .gte('risk_score', 50)
      .order('risk_score', { ascending: false })
      .limit(10),
  ]);

  const alerts = alertsResult.data ?? [];
  const unresolvedCount = alerts.filter((a) => !a.resolved).length;
  const highRiskCount = alerts.filter((a) => a.risk_score >= 70 && !a.resolved).length;

  return {
    total_alerts: alerts.length,
    unresolved: unresolvedCount,
    high_risk: highRiskCount,
    top_risk_licenses: topRiskResult.data ?? [],
  };
}
