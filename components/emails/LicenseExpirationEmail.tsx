import * as React from "react";

interface LicenseExpirationEmailProps {
  firstName?: string;
  packageName: string;
  expiresAt: string;
  daysRemaining: number;
  activeDevices: number;
  maxDevices: number;
  licensesUrl: string;
}

export function LicenseExpirationEmail({
  firstName,
  packageName,
  expiresAt,
  daysRemaining,
  activeDevices,
  maxDevices,
  licensesUrl,
}: LicenseExpirationEmailProps) {
  const urgencyColor = daysRemaining <= 3 ? "#dc2626" : "#f59e0b";

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ padding: "32px 24px", backgroundColor: "#fafafa" }}>
        <div style={{
          display: "inline-block",
          backgroundColor: daysRemaining <= 3 ? "#fef2f2" : "#fffbeb",
          color: urgencyColor,
          padding: "4px 10px",
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 16,
        }}>
          License Expiring Soon
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 16px 0", color: "#111" }}>
          {firstName ? `Hi ${firstName}, your` : "Your"} {packageName} license expires in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.6, color: "#333", margin: "0 0 24px 0" }}>
          Your license for <strong>{packageName}</strong> will expire on{" "}
          <strong>{new Date(expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>.
          After expiration, your software will no longer be activated.
        </p>

        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          padding: "16px 20px",
          margin: "0 0 24px 0",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 0", color: "#666", fontSize: 14 }}>Expiration Date</td>
                <td style={{ padding: "4px 0", color: urgencyColor, fontSize: 14, fontWeight: 600, textAlign: "right" as const }}>
                  {new Date(expiresAt).toLocaleDateString()}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: "#666", fontSize: 14 }}>Active Devices</td>
                <td style={{ padding: "4px 0", color: "#111", fontSize: 14, fontWeight: 500, textAlign: "right" as const }}>
                  {activeDevices} / {maxDevices}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <a
          href={licensesUrl}
          style={{
            display: "inline-block",
            backgroundColor: "#111",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          Manage License →
        </a>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #eee" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px 0", color: "#111" }}>
            How to Renew
          </h3>
          <ol style={{ margin: 0, paddingLeft: 20, color: "#555", lineHeight: 1.8 }}>
            <li>Visit the product page and purchase a new license</li>
            <li>Your existing devices will be migrated to the new license</li>
            <li>No reinstallation required</li>
          </ol>
        </div>

        <p style={{ fontSize: 12, color: "#888", marginTop: 32 }}>
          Need help? Contact us at support@portal28.academy
        </p>
      </div>

      <div style={{ padding: "16px 24px", backgroundColor: "#f0f0f0", textAlign: "center" as const }}>
        <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
          © Portal28 Academy
        </p>
      </div>
    </div>
  );
}
