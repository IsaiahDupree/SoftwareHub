import {
  mockAuthService,
  mockDbService,
  mockPaymentService,
  mockEmailService,
  mockUser,
  resetAllMocks,
} from "./services";

describe("Mock Service Layer", () => {
  afterEach(() => {
    resetAllMocks();
  });

  describe("Auth Service Mocks", () => {
    it("should provide authenticated user by default", async () => {
      const { data } = await mockAuthService.getUser();
      expect(data.user).toEqual(mockUser);
      expect(data.user?.email).toBe("test@example.com");
    });

    it("should simulate unauthenticated state", async () => {
      mockAuthService.simulateUnauthenticated();
      const { data } = await mockAuthService.getUser();
      expect(data.user).toBeNull();
    });

    it("should simulate auth errors", async () => {
      mockAuthService.simulateError("Invalid credentials");
      const { error } = await mockAuthService.getUser();
      expect(error).toBeTruthy();
      expect(error?.message).toBe("Invalid credentials");
    });

    it("should mock sign in", async () => {
      const { data } = await mockAuthService.signIn();
      expect(data.user).toEqual(mockUser);
      expect(data.session).toBeTruthy();
    });

    it("should mock sign out", async () => {
      const { error } = await mockAuthService.signOut();
      expect(error).toBeNull();
    });

    it("should reset to default state", async () => {
      mockAuthService.simulateUnauthenticated();
      mockAuthService.reset();
      const { data } = await mockAuthService.getUser();
      expect(data.user).toEqual(mockUser);
    });
  });

  describe("Database Service Mocks", () => {
    it("should provide query builder methods", () => {
      const query = mockDbService.from("test_table");
      expect(query.select).toBeDefined();
      expect(query.insert).toBeDefined();
      expect(query.update).toBeDefined();
      expect(query.delete).toBeDefined();
      expect(query.eq).toBeDefined();
    });

    it("should mock courses operations", async () => {
      const course = await mockDbService.courses.findById("course-123");
      expect(course.id).toBe("course-123");
      expect(course.title).toBe("Test Course");
    });

    it("should mock packages operations", async () => {
      const packages = await mockDbService.packages.findAll();
      expect(packages).toHaveLength(2);
      expect(packages[0].name).toBe("Test Package 1");
    });

    it("should mock licenses operations", async () => {
      const license = await mockDbService.licenses.findByKey("TEST-1234");
      expect(license.license_key).toBe("TEST-1234-5678-ABCD-EFGH");
      expect(license.status).toBe("active");
    });

    it("should mock enrollments operations", async () => {
      const enrollments = await mockDbService.enrollments.findByUser("user-123");
      expect(enrollments).toHaveLength(1);
      expect(enrollments[0].course_id).toBe("course-123");
    });

    it("should simulate database errors", async () => {
      mockDbService.simulateError("test_table", "select", "Connection timeout");
      const query = mockDbService.from("test_table");
      const { error } = await query.select();
      expect(error).toBeTruthy();
      expect(error.message).toBe("Connection timeout");
    });

    it("should chain query methods", () => {
      const query = mockDbService
        .from("test_table")
        .select()
        .eq("id", "123")
        .order("created_at");

      expect(query).toBeTruthy();
    });
  });

  describe("Payment Service Mocks (Stripe)", () => {
    it("should create checkout session", async () => {
      const session = await mockPaymentService.checkout.sessions.create({
        line_items: [],
        mode: "payment",
      });
      expect(session.id).toBe("cs_test_123");
      expect(session.url).toContain("checkout.stripe.com");
    });

    it("should retrieve checkout session", async () => {
      const session = await mockPaymentService.checkout.sessions.retrieve("cs_test_123");
      expect(session.payment_status).toBe("paid");
    });

    it("should create customer", async () => {
      const customer = await mockPaymentService.customers.create({
        email: "customer@example.com",
      });
      expect(customer.id).toBe("cus_test_123");
    });

    it("should create subscription", async () => {
      const subscription = await mockPaymentService.subscriptions.create({
        customer: "cus_test_123",
        items: [{ price: "price_test_123" }],
      });
      expect(subscription.id).toBe("sub_test_123");
      expect(subscription.status).toBe("active");
    });

    it("should construct webhook event", () => {
      const event = mockPaymentService.webhooks.constructEvent(
        "payload",
        "signature",
        "secret"
      );
      expect(event.type).toBe("checkout.session.completed");
      expect(event.data.object.id).toBe("cs_test_123");
    });

    it("should simulate payment errors", async () => {
      mockPaymentService.simulateError(
        "checkout.sessions.create",
        "Card declined"
      );

      await expect(
        mockPaymentService.checkout.sessions.create({})
      ).rejects.toThrow("Card declined");
    });

    it("should retrieve price", async () => {
      const price = await mockPaymentService.prices.retrieve("price_test_123");
      expect(price.unit_amount).toBe(4900);
      expect(price.currency).toBe("usd");
    });
  });

  describe("Email Service Mocks (Resend)", () => {
    it("should send email", async () => {
      const result = await mockEmailService.send({
        from: "noreply@example.com",
        to: "recipient@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });
      expect(result.id).toBe("email-test-123");
    });

    it("should send batch emails", async () => {
      const result = await mockEmailService.sendBatch([
        { to: "user1@example.com", subject: "Test 1" },
        { to: "user2@example.com", subject: "Test 2" },
      ]);
      expect(result.data).toHaveLength(2);
    });

    it("should send welcome email", async () => {
      const result = await mockEmailService.sendWelcomeEmail({
        to: "newuser@example.com",
        name: "New User",
      });
      expect(result.id).toBe("email-welcome-123");
    });

    it("should send purchase confirmation", async () => {
      const result = await mockEmailService.sendPurchaseConfirmation({
        to: "customer@example.com",
        orderId: "order-123",
      });
      expect(result.id).toBe("email-purchase-123");
    });

    it("should simulate email errors", async () => {
      mockEmailService.simulateError("SMTP connection failed");

      await expect(
        mockEmailService.send({ to: "test@example.com" })
      ).rejects.toThrow("SMTP connection failed");
    });
  });

  describe("Reset All Mocks", () => {
    it("should reset all service mocks", () => {
      // Make some calls
      mockAuthService.getUser();
      mockDbService.from("test");
      mockPaymentService.checkout.sessions.create({});
      mockEmailService.send({});

      // Verify calls were made
      expect(mockAuthService.getUser).toHaveBeenCalled();
      expect(mockDbService.from).toHaveBeenCalled();
      expect(mockPaymentService.checkout.sessions.create).toHaveBeenCalled();
      expect(mockEmailService.send).toHaveBeenCalled();

      // Reset all
      resetAllMocks();

      // Verify all were cleared
      expect(mockAuthService.getUser).not.toHaveBeenCalled();
      expect(mockDbService.from).not.toHaveBeenCalled();
      expect(mockPaymentService.checkout.sessions.create).not.toHaveBeenCalled();
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });
  });
});
