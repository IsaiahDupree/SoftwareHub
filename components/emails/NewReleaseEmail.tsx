import * as React from "react";

interface NewReleaseEmailProps {
  firstName?: string;
  packageName: string;
  version: string;
  releaseNotes: string;
  downloadUrl: string;
  changelogUrl: string;
  channel: string;
}

export function NewReleaseEmail({
  firstName,
  packageName,
  version,
  releaseNotes,
  downloadUrl,
  changelogUrl,
  channel,
}: NewReleaseEmailProps) {
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ padding: "32px 24px", backgroundColor: "#fafafa" }}>
        <div style={{ display: "inline-block", backgroundColor: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
          New Release
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px 0", color: "#111" }}>
          {packageName} v{version}
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.6, color: "#333", margin: "0 0 24px 0" }}>
          {firstName ? `Hi ${firstName}, a` : "A"} new {channel === "stable" ? "" : `${channel} `}version of{" "}
          <strong>{packageName}</strong> is available.
        </p>

        {releaseNotes && (
          <div style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 8,
            padding: "16px 20px",
            margin: "0 0 24px 0",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px 0", color: "#111" }}>
              Release Notes
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#555", margin: 0, whiteSpace: "pre-wrap" as const }}>
              {releaseNotes}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
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
            Download Now →
          </a>
          <a
            href={changelogUrl}
            style={{
              display: "inline-block",
              backgroundColor: "#fff",
              color: "#111",
              padding: "12px 24px",
              borderRadius: 6,
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 14,
              border: "1px solid #ddd",
            }}
          >
            View Changelog
          </a>
        </div>

        <p style={{ fontSize: 12, color: "#888", marginTop: 32 }}>
          You received this because you own {packageName}.{" "}
          <a href={`${downloadUrl.replace("/downloads", "/settings/notifications")}`} style={{ color: "#666" }}>
            Manage notification preferences
          </a>
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
