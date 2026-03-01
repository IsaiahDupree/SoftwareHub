import { render } from "@testing-library/react";
import PackageForm from "@/components/admin/PackageForm";
import type { Package } from "@/lib/types/packages";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch for courses API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ courses: [] }),
  })
) as jest.Mock;

describe("PackageForm Snapshot Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("matches snapshot in create mode with empty form", () => {
    const { container } = render(<PackageForm mode="create" />);
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot in edit mode with existing package data", () => {
    const mockPackage: Package = {
      package_id: "test-id-1",
      name: "Test Package",
      slug: "test-package",
      tagline: "A test package",
      description: "This is a test package for snapshot testing",
      type: "LOCAL_AGENT",
      requires_macos: true,
      min_os_version: "13.0",
      download_url: "https://example.com/download",
      web_app_url: null,
      status: "operational",
      status_message: null,
      status_check_url: "https://example.com/health",
      price_cents: 4900,
      icon_url: "/icons/test.png",
      banner_url: "/banners/test.jpg",
      features: ["Feature 1", "Feature 2", "Feature 3"],
      requirements: { ram: "8GB", storage: "2GB" },
      documentation_url: "https://docs.example.com",
      support_url: "https://support.example.com",
      related_course_id: "course-123",
      is_published: true,
      is_featured: false,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const { container } = render(<PackageForm mode="edit" package={mockPackage} />);
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot in edit mode with minimal package data", () => {
    const mockPackage: Package = {
      package_id: "test-id-2",
      name: "Minimal Package",
      slug: "minimal-package",
      tagline: null,
      description: "Minimal package",
      type: "SAAS",
      requires_macos: false,
      min_os_version: null,
      download_url: null,
      web_app_url: "https://app.example.com",
      status: "operational",
      status_message: null,
      status_check_url: null,
      price_cents: null,
      icon_url: null,
      banner_url: null,
      features: [],
      requirements: {},
      documentation_url: null,
      support_url: null,
      related_course_id: null,
      is_published: false,
      is_featured: false,
      sort_order: 0,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const { container } = render(<PackageForm mode="edit" package={mockPackage} />);
    expect(container).toMatchSnapshot();
  });
});
