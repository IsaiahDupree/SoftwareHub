import { render } from "@testing-library/react";
import { StatusDashboard } from "@/components/status/StatusDashboard";

describe("StatusDashboard Snapshot Tests", () => {
  it("matches snapshot with all operational services", () => {
    const mockPackages = [
      {
        package_id: "1",
        name: "Watermark Remover",
        slug: "watermark-remover",
        icon_url: "/icons/watermark.png",
        type: "desktop",
        status: "operational",
        last_check: {
          status: "operational",
          response_time_ms: 45,
          checked_at: new Date().toISOString(),
          message: null,
        },
      },
      {
        package_id: "2",
        name: "TTS Studio",
        slug: "tts-studio",
        icon_url: null,
        type: "desktop",
        status: "operational",
        last_check: {
          status: "operational",
          response_time_ms: 120,
          checked_at: new Date().toISOString(),
          message: null,
        },
      },
    ];

    const { container } = render(
      <StatusDashboard packages={mockPackages} overallStatus="operational" />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with partial outage", () => {
    const mockPackages = [
      {
        package_id: "1",
        name: "Watermark Remover",
        slug: "watermark-remover",
        icon_url: null,
        type: "desktop",
        status: "operational",
        last_check: {
          status: "operational",
          response_time_ms: 45,
          checked_at: new Date().toISOString(),
          message: null,
        },
      },
      {
        package_id: "2",
        name: "TTS Studio",
        slug: "tts-studio",
        icon_url: null,
        type: "desktop",
        status: "degraded",
        last_check: {
          status: "degraded",
          response_time_ms: 5000,
          checked_at: new Date().toISOString(),
          message: "Slow response times detected",
        },
      },
    ];

    const { container } = render(
      <StatusDashboard packages={mockPackages} overallStatus="partial_outage" />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with major outage", () => {
    const mockPackages = [
      {
        package_id: "1",
        name: "Watermark Remover",
        slug: "watermark-remover",
        icon_url: null,
        type: "desktop",
        status: "down",
        last_check: {
          status: "down",
          response_time_ms: null,
          checked_at: new Date().toISOString(),
          message: "Service unreachable",
        },
      },
    ];

    const { container } = render(
      <StatusDashboard packages={mockPackages} overallStatus="major_outage" />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with maintenance mode", () => {
    const mockPackages = [
      {
        package_id: "1",
        name: "Auto Comment",
        slug: "auto-comment",
        icon_url: "/icons/comment.png",
        type: "saas",
        status: "maintenance",
        last_check: {
          status: "maintenance",
          response_time_ms: null,
          checked_at: new Date().toISOString(),
          message: "Scheduled maintenance in progress",
        },
      },
    ];

    const { container } = render(
      <StatusDashboard packages={mockPackages} overallStatus="maintenance" />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with empty packages array", () => {
    const { container } = render(
      <StatusDashboard packages={[]} overallStatus="operational" />
    );
    expect(container).toMatchSnapshot();
  });
});
