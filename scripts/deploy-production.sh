#!/usr/bin/env bash
# =============================================================================
# SoftwareHub Production Deployment Script
# =============================================================================
# Usage: ./scripts/deploy-production.sh [--check | --migrate | --full]
#
# Options:
#   --check    Verify all environment variables and prerequisites
#   --migrate  Push database migrations to production Supabase
#   --full     Run full deployment checklist
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }

# ---------------------------------------------------------------------------
# Check environment variables
# ---------------------------------------------------------------------------
check_env() {
  echo ""
  echo "=== Environment Variable Check ==="
  local missing=0

  # Required for production
  local required_vars=(
    "NEXT_PUBLIC_SITE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "RESEND_API_KEY"
    "CRON_SECRET"
    "LICENSE_JWT_SECRET"
  )

  for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
      fail "$var is not set"
      missing=$((missing + 1))
    else
      ok "$var is set"
    fi
  done

  # Optional but recommended
  local optional_vars=(
    "S3_ACCESS_KEY_ID"
    "S3_SECRET_ACCESS_KEY"
    "S3_BUCKET_NAME"
    "MUX_TOKEN_ID"
    "MUX_TOKEN_SECRET"
    "NEXT_PUBLIC_META_PIXEL_ID"
  )

  echo ""
  echo "--- Optional Variables ---"
  for var in "${optional_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
      warn "$var is not set (optional)"
    else
      ok "$var is set"
    fi
  done

  if [ $missing -gt 0 ]; then
    echo ""
    fail "$missing required variable(s) missing!"
    return 1
  fi

  echo ""
  ok "All required environment variables are set."
}

# ---------------------------------------------------------------------------
# Check Supabase production URL
# ---------------------------------------------------------------------------
check_supabase() {
  echo ""
  echo "=== Supabase Connection Check ==="

  local url="${NEXT_PUBLIC_SUPABASE_URL:-}"
  if [ -z "$url" ]; then
    fail "NEXT_PUBLIC_SUPABASE_URL is not set"
    return 1
  fi

  # Check if it's a production URL (not localhost)
  if echo "$url" | grep -q "127.0.0.1\|localhost"; then
    warn "Supabase URL points to localhost - are you sure this is production?"
  else
    ok "Supabase URL: $url"
  fi

  # Try to reach the health endpoint
  if command -v curl &> /dev/null; then
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" "${url}/rest/v1/" -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" 2>/dev/null || echo "000")
    if [ "$status" = "200" ]; then
      ok "Supabase API is reachable (HTTP $status)"
    else
      warn "Supabase API returned HTTP $status"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Push migrations
# ---------------------------------------------------------------------------
push_migrations() {
  echo ""
  echo "=== Push Database Migrations ==="

  if ! command -v supabase &> /dev/null; then
    fail "Supabase CLI is not installed. Install: npm install -g supabase"
    return 1
  fi

  echo "This will push all local migrations to your linked Supabase project."
  echo "Make sure you have linked your project: supabase link --project-ref <ref>"
  echo ""

  read -p "Continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    return 0
  fi

  supabase db push
  ok "Migrations pushed successfully"
}

# ---------------------------------------------------------------------------
# Build check
# ---------------------------------------------------------------------------
check_build() {
  echo ""
  echo "=== Build Check ==="

  npm run build 2>&1 | tail -5
  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    ok "Build succeeded"
  else
    fail "Build failed"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Full deployment checklist
# ---------------------------------------------------------------------------
full_checklist() {
  echo "============================================="
  echo "  SoftwareHub Production Deployment Checklist"
  echo "============================================="

  echo ""
  echo "1. Pre-deployment"
  echo "   [ ] All tests passing (npm run test)"
  echo "   [ ] Build succeeds (npm run build)"
  echo "   [ ] Environment variables configured on Vercel"
  echo ""
  echo "2. Supabase Production"
  echo "   [ ] Project created at supabase.com"
  echo "   [ ] Project linked: supabase link --project-ref <ref>"
  echo "   [ ] Migrations pushed: supabase db push"
  echo "   [ ] RLS policies verified in Supabase Studio"
  echo "   [ ] Database backups enabled (Settings > Database > Backups)"
  echo "   [ ] Auth providers configured (magic link)"
  echo "   [ ] Auth redirect URLs set to production domain"
  echo ""
  echo "3. Stripe Production"
  echo "   [ ] Live mode enabled on Stripe dashboard"
  echo "   [ ] Webhook endpoint created: https://yourdomain.com/api/stripe/webhook"
  echo "   [ ] Webhook events: checkout.session.completed, customer.subscription.*"
  echo "   [ ] Products and prices created for all packages/bundles/tiers"
  echo "   [ ] STRIPE_SECRET_KEY set to sk_live_*"
  echo "   [ ] STRIPE_WEBHOOK_SECRET set to whsec_*"
  echo "   [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY set to pk_live_*"
  echo ""
  echo "4. Cloudflare R2"
  echo "   [ ] R2 bucket created in Cloudflare dashboard"
  echo "   [ ] API token created with R2 read/write permissions"
  echo "   [ ] CORS policy configured (allow your production domain)"
  echo "   [ ] S3_ENDPOINT set to https://<account_id>.r2.cloudflarestorage.com"
  echo "   [ ] S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY set"
  echo "   [ ] Public domain configured if using S3_PUBLIC_URL"
  echo ""
  echo "5. Domain & DNS"
  echo "   [ ] Domain added to Vercel project"
  echo "   [ ] DNS records configured (A/CNAME)"
  echo "   [ ] SSL certificate provisioned (automatic on Vercel)"
  echo "   [ ] NEXT_PUBLIC_SITE_URL set to production URL"
  echo ""
  echo "6. Email (Resend)"
  echo "   [ ] Domain verified in Resend"
  echo "   [ ] RESEND_API_KEY set"
  echo "   [ ] RESEND_FROM set with verified domain"
  echo ""
  echo "7. Post-deployment"
  echo "   [ ] Health check: https://yourdomain.com/healthz"
  echo "   [ ] Auth flow: magic link login works"
  echo "   [ ] Stripe: test purchase in live mode"
  echo "   [ ] Cron jobs running (check Vercel dashboard)"
  echo "   [ ] License activation flow works"
  echo ""

  # Run automated checks
  check_env || true
  check_supabase || true
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
case "${1:-}" in
  --check)
    check_env
    check_supabase
    ;;
  --migrate)
    push_migrations
    ;;
  --build)
    check_build
    ;;
  --full)
    full_checklist
    ;;
  *)
    echo "Usage: $0 [--check | --migrate | --build | --full]"
    echo ""
    echo "  --check    Verify environment variables and connections"
    echo "  --migrate  Push database migrations to production"
    echo "  --build    Verify the build succeeds"
    echo "  --full     Show full deployment checklist"
    exit 1
    ;;
esac
