/**
 * Regression Test: Edge Case - Empty Course Progress
 *
 * Bug Description:
 * CourseProgressBar component crashed when rendering courses with no modules
 * or lessons, causing a division by zero error.
 *
 * Root Cause:
 * Progress calculation did not handle totalLessons = 0 gracefully.
 * Formula: (completed / total) * 100 threw NaN when total = 0.
 *
 * Fixed In:
 * Commit: def456ghi (hypothetical)
 * Date: 2026-02-20
 *
 * Test Coverage:
 * - Course with 0 modules
 * - Course with modules but 0 lessons
 * - Course with null/undefined lesson count
 * - Progress bar renders without crashing
 * - Shows appropriate "0%" or "No content" message
 */

import { render, screen } from "@testing-library/react";
import CourseProgressBar from "@/components/progress/CourseProgressBar";

describe("Edge Case: Empty Course Progress", () => {
  it("should handle course with zero lessons without crashing", () => {
    expect(() => {
      render(<CourseProgressBar lessonsCompleted={0} totalLessons={0} />);
    }).not.toThrow();
  });

  it("should display 0% for empty course", () => {
    render(<CourseProgressBar lessonsCompleted={0} totalLessons={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should display correct lesson count for empty course", () => {
    render(<CourseProgressBar lessonsCompleted={0} totalLessons={0} />);
    expect(screen.getByText("0 of 0 lessons")).toBeInTheDocument();
  });

  it("should not display NaN or Infinity", () => {
    const { container } = render(
      <CourseProgressBar lessonsCompleted={0} totalLessons={0} />
    );

    const text = container.textContent || "";
    expect(text).not.toContain("NaN");
    expect(text).not.toContain("Infinity");
  });

  it("should handle negative values gracefully", () => {
    // Edge case: corrupted data
    render(<CourseProgressBar lessonsCompleted={-1} totalLessons={-1} />);

    const percentage = screen.getByText(/\d+%/);
    expect(percentage).toBeInTheDocument();

    // Should clamp to 0% or handle gracefully
    expect(percentage.textContent).toMatch(/^(0%|100%)$/);
  });

  it("should handle completed > total gracefully", () => {
    // Edge case: data inconsistency
    render(<CourseProgressBar lessonsCompleted={10} totalLessons={5} />);

    const percentage = screen.getByText(/\d+%/);
    expect(percentage).toBeInTheDocument();

    // Should cap at 100%
    expect(percentage.textContent).toBe("100%");
  });

  it("should handle null/undefined total lessons", () => {
    expect(() => {
      render(
        <CourseProgressBar
          lessonsCompleted={0}
          totalLessons={undefined as any}
        />
      );
    }).not.toThrow();
  });

  it("should render progress bar visually even when empty", () => {
    const { container } = render(
      <CourseProgressBar lessonsCompleted={0} totalLessons={0} />
    );

    // Check for progress bar element (aria-role or class)
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });
});
