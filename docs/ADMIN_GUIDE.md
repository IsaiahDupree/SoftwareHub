# SoftwareHub Admin Guide

---

## Accessing the Admin Panel

1. Sign in with an admin account
2. Navigate to `/admin` or click **Admin** in the navigation
3. The admin dashboard shows an overview of packages, licenses, and analytics

Only users with `role = 'admin'` in the database can access admin pages.

---

## Package Management

### Creating a Package

1. Go to **Admin > Packages**
2. Click **New Package**
3. Fill in the required fields:
   - **Name** — Display name (e.g., "ProEdit Studio")
   - **Slug** — URL-friendly identifier (auto-generated from name)
   - **Type** — `DESKTOP_APP`, `CLOUD_APP`, `CLI_TOOL`, or `PLUGIN`
   - **Tagline** — Short description shown in listings
   - **Description** — Full description (supports markdown/HTML)
   - **Price** — Price in dollars (stored as cents internally)
   - **Icon** — Upload a square icon image
4. Click **Save**

### Package Types

| Type | Description | License Model |
|------|-------------|---------------|
| `DESKTOP_APP` | Native macOS/Windows app | Device-based activation |
| `CLOUD_APP` | Web application | SSO-based access |
| `CLI_TOOL` | Command-line tool | Device-based activation |
| `PLUGIN` | Extension/plugin for other software | Device-based activation |

### Package Settings

- **Published** — Toggle to show/hide from the public catalog
- **Trial Enabled** — Allow free trials; set trial duration in days
- **Min OS Version** — Minimum macOS version required
- **Status Check URL** — URL to ping for uptime monitoring
- **Related Course** — Link to a course for setup tutorials
- **Stripe Price ID** — Auto-set when using the Stripe setup script, or enter manually

### Publishing Releases

1. Go to **Admin > Packages > [Package] > Releases**
2. Click **New Release**
3. Enter:
   - **Version** (semver, e.g., `1.2.0`)
   - **Release Notes** (changelog)
   - **Binary URL** (upload to R2 or enter direct URL)
   - **Min OS Version** for this release
   - **File Size**
4. Mark as **Published** when ready
5. The latest published release becomes the default download

---

## License Management

### Viewing Licenses

Go to **Admin > Licenses** to see all licenses in the system:

- Filter by status (active, expired, suspended, revoked)
- Filter by package
- Search by user email or license key
- View device activations for each license

### License Statuses

| Status | Meaning |
|--------|---------|
| `active` | Working normally |
| `expired` | Past expiration date (7-day grace period applies) |
| `suspended` | Temporarily disabled by admin |
| `revoked` | Permanently disabled |

### Managing a License

Click on any license to:

- **View details** — Key (masked), user, package, dates, devices
- **Suspend/Revoke** — Disable the license
- **Reactivate** — Re-enable a suspended license
- **Adjust device limit** — Change max devices
- **View activations** — See all device activations with timestamps and IP addresses

### Granting Licenses Manually

To give a user access without a purchase:

1. Go to **Admin > Licenses**
2. Click **Grant License**
3. Select the user and package
4. Set the license type (perpetual or time-limited)
5. A new license key is generated and the user is notified

---

## Bundle Management

### Creating a Bundle

1. Go to **Admin > Package Bundles**
2. Click **New Bundle**
3. Configure:
   - **Name** — Bundle name
   - **Slug** — URL identifier
   - **Description** — What the bundle includes
   - **Price** — Bundle price (should be less than individual total)
   - **Badge** — Optional label (e.g., "Best Value")
   - **Icon** — Bundle icon
   - **Features** — List of selling points
4. Add packages to the bundle
5. Set the **sort order** for each package
6. Create a Stripe product/price (or use the setup script)
7. **Publish** when ready

---

## Subscription Tier Management

### Creating a Tier

1. Go to **Admin > Subscription Tiers**
2. Click **New Tier**
3. Configure:
   - **Name** — Tier name (e.g., "Pro Access")
   - **Monthly Price** — Price per month
   - **Yearly Price** — Price per year (typically discounted)
   - **Includes All Packages** — Toggle for all-access
   - **Included Package IDs** — If not all, specify which packages
   - **Max Devices** — Per-license device limit for subscribers
   - **Description** — Tier description
   - **Features** — List of included features
4. Create Stripe prices (monthly + yearly recurring)
5. **Publish** when ready

Subscribers receive entitlements for all included packages, which are automatically revoked on cancellation.

---

## Course Management

### Course Studio

The Course Studio (`/admin/studio`) provides a visual editor for courses:

1. **Create a course** — Name, slug, description, thumbnail
2. **Add chapters** — Organize content into sections
3. **Add lessons** — Three types:
   - **Multimedia** — Video content (upload to Mux or enter external URL)
   - **Text** — HTML/rich text content
   - **Download** — Link to a software package for download
4. **Drag to reorder** — Chapters and lessons support drag-and-drop
5. **Lesson settings:**
   - Published/unpublished
   - Free preview (accessible without purchase)
   - Drip schedule (immediate, days after enrollment, specific date)

### Auto-Generated Lessons

For packages linked to a course, you can auto-generate setup lessons:

1. Go to **Admin > Packages > [Package]**
2. Ensure a **Related Course** is set
3. Click **Generate Setup Lessons**
4. Three lessons are created (in draft):
   - Installation Guide
   - License Activation Guide
   - Troubleshooting Guide
5. Review and edit the generated content
6. Publish when ready

---

## Analytics

### Package Dashboard

The admin dashboard shows:

- **Total packages** — Published and unpublished counts
- **Total licenses** — Active, expired, suspended
- **Revenue** — From package sales, bundles, and subscriptions
- **Recent purchases** — Latest transactions

### Download Analytics

Track software downloads:

- Downloads per package over time
- Version distribution
- Platform breakdown
- Geographic distribution (from IP)

### License Analytics

Monitor licensing:

- Activation trends
- Device usage per license
- Expiration timeline
- Trial conversion rates

---

## Email System

### Automated Emails

The system sends these emails automatically:

| Email | Trigger |
|-------|---------|
| Purchase confirmation | After successful checkout |
| License key delivery | Included in purchase confirmation |
| New release notification | When a new release is published |
| License expiration warning | 7 days before expiration |
| Certificate earned | When course is completed |

### Email Automations

Create multi-step email sequences:

1. Go to **Admin > Email Automations**
2. Create a new automation
3. Set the trigger (enrollment, purchase, etc.)
4. Add steps with delays and email templates
5. Activate the automation

### Email Programs

For one-off or recurring email campaigns:

1. Go to **Admin > Email Programs**
2. Create a new program with subject and body
3. Send a test email to verify
4. Approve and send to your audience

---

## Community Management

### Spaces

Community spaces are discussion areas:

1. Go to **Admin > Community > Spaces**
2. Create spaces for different topics
3. Set access levels (public, enrolled users, etc.)

### Moderation

- **Flag/unflag** threads and posts
- **Issue warnings** to users
- **Delete** inappropriate content
- **Pin** important threads

### Chat Channels

Real-time chat for enrolled users:

1. Go to **Admin > Chat Channels**
2. Create channels for different purposes
3. Monitor activity in the admin view

---

## Promo Codes

### Creating Promo Codes

1. Go to **Admin > Promo Codes**
2. Click **New Code**
3. Configure:
   - **Code** — The text users enter (e.g., `SAVE20`)
   - **Discount Type** — Percentage or fixed amount
   - **Discount Value** — Amount or percentage
   - **Max Uses** — Total redemption limit
   - **Expires At** — Optional expiration date
   - **Applicable Packages** — Specific packages or all
4. **Activate** the code

### Tracking Usage

View redemption counts and revenue impact for each promo code.

---

## Referral System

### How It Works

1. Users get a unique referral code
2. They share it with others
3. When someone purchases using the code, the referrer earns 10% credit
4. Credits are tracked in the referral dashboard

### Admin View

- View all referral codes and their owners
- See conversion history
- Monitor credit balances
- Adjust credit percentages if needed

---

## Cron Jobs

These run automatically on Vercel:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Automation Scheduler | Hourly | Process email automation steps |
| Certificate Emails | Daily 9am | Send pending certificate notifications |
| License Expiration | Daily 8am | Warn users of expiring licenses |
| Status Check | Every 15 min | Monitor package uptime |

Cron jobs are authenticated with the `CRON_SECRET` environment variable.

---

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set all environment variables (see `.env.example`)
3. Deploy — Vercel auto-detects Next.js configuration
4. Set up your custom domain

### Running the Deploy Checklist

```bash
./scripts/deploy-production.sh --full
```

This shows a complete checklist and verifies environment configuration.

### Setting Up Stripe Products

```bash
npx ts-node scripts/setup-stripe-products.ts --dry-run  # Preview
npx ts-node scripts/setup-stripe-products.ts             # Execute
```

This creates Stripe products and prices for all published packages, bundles, and subscription tiers, then updates the database with the Stripe IDs.

---

## Common Admin Tasks

### Granting a Free License

1. Navigate to the user's profile in admin
2. Click **Grant Entitlement**
3. Select the package
4. A license is generated with source `admin_grant`

### Investigating a Support Ticket

1. Search for the user by email in **Admin > Users**
2. Check their licenses, entitlements, and purchase history
3. View device activations if it's a device issue
4. Check email sends for delivery issues

### Handling a Refund

1. Process the refund in Stripe Dashboard
2. The webhook will update the entitlement status
3. Optionally revoke the license in admin

### Updating Package Pricing

1. Create a new Stripe price (don't modify the old one)
2. Update the `stripe_price_id` in admin package settings
3. Existing purchases are unaffected
4. New purchases use the new price

---

## Security Notes

- Admin access is checked at both middleware and API route level
- All admin API routes verify `role = 'admin'` from the database
- Service role key is used server-side only — never exposed to the client
- Webhook signatures are validated for Stripe, Mux, and Resend
- License keys are stored as SHA256 hashes — raw keys are only visible to the owner
