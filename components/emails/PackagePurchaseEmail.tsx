import * as React from "react";

interface PackagePurchaseEmailProps {
  firstName?: string;
  packageName: string;
  licenseKey: string;
  downloadUrl: string;
  licenseType: string;
  maxDevices: number;
}

export function PackagePurchaseEmail({
  firstName,
  packageName,
  licenseKey,
  downloadUrl,
  licenseType,
  maxDevices,
}: PackagePurchaseEmailProps) {
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ padding: "32px 24px", backgroundColor: "#fafafa" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 16px 0", color: "#111" }}>
          {firstName ? `Thanks for your purchase, ${firstName}!` : "Thanks for your purchase!"}
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.6, color: "#333", margin: "0 0 24px 0" }}>
          Your license for <strong>{packageName}</strong> is ready. Here are your details:
        </p>

        {/* License Key Box */}
        <div style={{
          backgroundColor: "#111",
          color: "#fff",
          padding: "16px 20px",
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 18,
          letterSpacing: 2,
          textAlign: "center" as const,
          margin: "0 0 24px 0",
        }}>
          {licenseKey}
        </div>

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
                <td style={{ padding: "4px 0", color: "#666", fontSize: 14 }}>License Type</td>
                <td style={{ padding: "4px 0", color: "#111", fontSize: 14, fontWeight: 500, textAlign: "right" as const }}>
                  {licenseType.charAt(0).toUpperCase() + licenseType.slice(1)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: "#666", fontSize: 14 }}>Max Devices</td>
                <td style={{ padding: "4px 0", color: "#111", fontSize: 14, fontWeight: 500, textAlign: "right" as const }}>
                  {maxDevices}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <a
          href={downloadUrl}
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
          Go to Downloads →
        </a>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #eee" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px 0", color: "#111" }}>
            Getting Started
          </h3>
          <ol style={{ margin: 0, paddingLeft: 20, color: "#555", lineHeight: 1.8 }}>
            <li>Go to your Downloads page and install the latest version</li>
            <li>Enter your license key when prompted during activation</li>
            <li>You can manage your devices from the Licenses page</li>
          </ol>
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #eee" }}>
          <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
            Keep this license key safe. You can always find it in your{" "}
            <a href={`${downloadUrl.replace("/downloads", "/licenses")}`} style={{ color: "#111" }}>
              Licenses dashboard
            </a>.
          </p>
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
