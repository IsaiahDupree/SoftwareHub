import { render } from "@testing-library/react";
import UpsellModal from "@/components/offers/UpsellModal";

// Mock timers for snapshot consistency
jest.useFakeTimers();

describe("UpsellModal Snapshot Tests", () => {
  const mockOnClose = jest.fn();
  const mockOnAccept = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it("matches snapshot when modal is open", () => {
    const { container } = render(
      <UpsellModal
        isOpen={true}
        onClose={mockOnClose}
        upsellOfferKey="test-offer"
        headline="Get 50% Off Pro Plan!"
        description="Upgrade now and save big on your purchase"
        priceLabel="$49"
        originalPriceLabel="$99"
        expiresMinutes={30}
        onAccept={mockOnAccept}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot when modal is closed", () => {
    const { container } = render(
      <UpsellModal
        isOpen={false}
        onClose={mockOnClose}
        upsellOfferKey="test-offer"
        headline="Get 50% Off Pro Plan!"
        priceLabel="$49"
        expiresMinutes={30}
        onAccept={mockOnAccept}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with minimal props", () => {
    const { container } = render(
      <UpsellModal
        isOpen={true}
        onClose={mockOnClose}
        upsellOfferKey="minimal-offer"
        headline="Limited Time Offer"
        priceLabel="$29"
        expiresMinutes={15}
        onAccept={mockOnAccept}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with all optional props", () => {
    const { container } = render(
      <UpsellModal
        isOpen={true}
        onClose={mockOnClose}
        upsellOfferKey="full-offer"
        headline="Exclusive Deal Just For You!"
        description="This is a one-time opportunity to get our premium plan at a massive discount. Don't miss out!"
        priceLabel="$149"
        originalPriceLabel="$299"
        expiresMinutes={60}
        onAccept={mockOnAccept}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with short expiration time", () => {
    const { container } = render(
      <UpsellModal
        isOpen={true}
        onClose={mockOnClose}
        upsellOfferKey="urgent-offer"
        headline="Flash Sale - Act Fast!"
        description="Only 5 minutes left to claim this deal"
        priceLabel="$19"
        originalPriceLabel="$49"
        expiresMinutes={5}
        onAccept={mockOnAccept}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
