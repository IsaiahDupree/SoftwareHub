import { render, screen, fireEvent } from "@testing-library/react";
import NewThreadForm from "@/components/community/NewThreadForm";

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Mock window.location.reload
delete (window as any).location;
window.location = { reload: jest.fn() } as any;

describe("NewThreadForm Snapshot Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("matches snapshot in collapsed state", () => {
    const { container } = render(
      <NewThreadForm widgetKey="test-widget" categorySlug="general" />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot in expanded state", () => {
    const { container } = render(
      <NewThreadForm widgetKey="test-widget" categorySlug="general" />
    );

    // Expand the form
    const button = screen.getByText("Start a new thread...");
    fireEvent.click(button);

    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with filled form data", () => {
    const { container } = render(
      <NewThreadForm widgetKey="test-widget" categorySlug="general" />
    );

    // Expand and fill the form
    const expandButton = screen.getByText("Start a new thread...");
    fireEvent.click(expandButton);

    const titleInput = screen.getByPlaceholderText("Thread title");
    const bodyTextarea = screen.getByPlaceholderText("Write your post...");

    fireEvent.change(titleInput, { target: { value: "Test Thread Title" } });
    fireEvent.change(bodyTextarea, { target: { value: "This is the body of my test thread." } });

    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with error state", () => {
    const { container } = render(
      <NewThreadForm widgetKey="test-widget" categorySlug="general" />
    );

    // Expand and try to submit without data
    const expandButton = screen.getByText("Start a new thread...");
    fireEvent.click(expandButton);

    const postButton = screen.getByText("Post Thread");
    fireEvent.click(postButton);

    expect(container).toMatchSnapshot();
  });
});
