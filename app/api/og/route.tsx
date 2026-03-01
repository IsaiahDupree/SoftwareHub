import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "SoftwareHub";
  const description =
    searchParams.get("description") || "Software tools and courses";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 80px",
          }}
        >
          <h1
            style={{
              fontSize: 60,
              color: "#f8fafc",
              textAlign: "center",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 28,
              color: "#94a3b8",
              textAlign: "center",
              marginTop: 20,
              maxWidth: 800,
            }}
          >
            {description}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 40,
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 24,
                color: "#3b82f6",
                fontWeight: "bold",
              }}
            >
              SoftwareHub
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
