#!/usr/bin/env bash
# =============================================================================
# SoftwareHub - Code Signing Setup Script (SEC-SH-002)
# Validates and exports macOS/Windows signing certificates for CI/CD use
#
# Usage:
#   ./scripts/setup-code-signing.sh [--mac | --win | --verify]
#
# Prerequisites:
#   macOS: Apple Developer certificate installed in Keychain
#   Windows: Code signing .pfx certificate file
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()      { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ---------------------------------------------------------------------------
# verify_mac_certificate
# Check that a valid Apple Developer ID Application certificate is installed
# ---------------------------------------------------------------------------
verify_mac_certificate() {
  log_info "Checking macOS code signing certificates..."

  local certs
  certs=$(security find-identity -v -p codesigning 2>/dev/null)

  if echo "$certs" | grep -q "Developer ID Application"; then
    log_ok "Found Developer ID Application certificate:"
    echo "$certs" | grep "Developer ID Application" | head -3
    return 0
  elif echo "$certs" | grep -q "Apple Development"; then
    log_warn "Found Apple Development certificate (not for distribution)."
    log_warn "For production releases, you need a 'Developer ID Application' certificate."
    echo "$certs" | grep "Apple Development" | head -3
    return 1
  else
    log_error "No valid code signing certificate found."
    log_error "Install your Apple Developer ID Application certificate via Keychain Access."
    return 1
  fi
}

# ---------------------------------------------------------------------------
# export_mac_certificate
# Exports the certificate + private key as base64 for GitHub Secrets
# ---------------------------------------------------------------------------
export_mac_certificate() {
  log_info "Exporting macOS certificate for GitHub Secrets..."

  local cert_identity
  cert_identity=$(security find-identity -v -p codesigning 2>/dev/null | grep "Developer ID Application" | head -1 | awk -F'"' '{print $2}')

  if [ -z "$cert_identity" ]; then
    log_error "No 'Developer ID Application' certificate found in keychain."
    exit 1
  fi

  log_info "Exporting: $cert_identity"

  local tmp_p12="/tmp/softwarehub-codesign-$$.p12"
  local password
  password=$(openssl rand -base64 32)

  log_info "Enter your Keychain password when prompted..."
  security export -k login.keychain -t identities -f pkcs12 -o "$tmp_p12" -P "$password" 2>/dev/null || \
  security export -k ~/Library/Keychains/login.keychain-db -t identities -f pkcs12 -o "$tmp_p12" -P "$password"

  local b64
  b64=$(base64 -i "$tmp_p12")

  rm -f "$tmp_p12"

  echo ""
  log_ok "Add these secrets to GitHub → Settings → Secrets → Actions:"
  echo ""
  echo "  MAC_CERT_BASE64:"
  echo "$b64" | head -5
  echo "  ... (truncated for display)"
  echo ""
  echo "  MAC_CERT_PASSWORD: $password"
  echo ""
  log_warn "Store these values securely — the password will not be shown again."
}

# ---------------------------------------------------------------------------
# verify_win_certificate
# Checks that a .pfx file exists and is valid
# ---------------------------------------------------------------------------
verify_win_certificate() {
  local pfx_file="${1:-}"

  if [ -z "$pfx_file" ]; then
    log_error "Usage: setup-code-signing.sh --win /path/to/certificate.pfx"
    exit 1
  fi

  if [ ! -f "$pfx_file" ]; then
    log_error "Certificate file not found: $pfx_file"
    exit 1
  fi

  log_info "Checking Windows certificate: $pfx_file"

  if command -v openssl &> /dev/null; then
    local subject
    subject=$(openssl pkcs12 -in "$pfx_file" -nokeys -passin pass: 2>/dev/null | openssl x509 -noout -subject 2>/dev/null || true)
    if [ -n "$subject" ]; then
      log_ok "Certificate subject: $subject"
    fi
  fi

  local b64
  b64=$(base64 -i "$pfx_file")

  echo ""
  log_ok "Add these secrets to GitHub → Settings → Secrets → Actions:"
  echo ""
  echo "  WIN_CERT_BASE64:"
  echo "$b64" | head -5
  echo "  ... (truncated for display)"
  echo ""
  echo "  WIN_CERT_PASSWORD: <your-pfx-password>"
}

# ---------------------------------------------------------------------------
# verify_all_secrets
# Check that all required GitHub secrets are documented
# ---------------------------------------------------------------------------
verify_secrets_checklist() {
  echo ""
  log_info "Required GitHub Secrets for all Electron app builds:"
  echo ""
  echo "  macOS Signing:"
  echo "    MAC_CERT_BASE64      - Developer ID Application cert (.p12) as base64"
  echo "    MAC_CERT_PASSWORD    - Password for the .p12 file"
  echo ""
  echo "  macOS Notarization:"
  echo "    APPLE_ID             - Apple ID email (e.g. dev@yourcompany.com)"
  echo "    APPLE_ID_PASS        - App-specific password (not your Apple ID password)"
  echo "    APPLE_TEAM_ID        - 10-character Team ID from developer.apple.com"
  echo ""
  echo "  Windows Signing:"
  echo "    WIN_CERT_BASE64      - Authenticode cert (.pfx) as base64"
  echo "    WIN_CERT_PASSWORD    - Password for the .pfx file"
  echo ""
  log_info "Apps that use these secrets:"
  echo "    - electron-watermark-remover (workflow: build-watermark-remover.yml)"
  echo "    - electron-tts-studio        (workflow: build-tts-studio.yml)"
  echo "    - electron-sora-video        (workflow: build-sora-video.yml)"
  echo ""
  log_info "Entitlements files required per app:"
  echo "    - packages/electron-*/build/entitlements.mac.plist"
  echo "    - packages/electron-*/scripts/notarize.js"
  echo ""

  # Check entitlements exist for all apps
  local apps=("electron-watermark-remover" "electron-tts-studio" "electron-sora-video")
  for app in "${apps[@]}"; do
    local app_dir="$REPO_ROOT/packages/$app"
    if [ -d "$app_dir" ]; then
      if [ -f "$app_dir/build/entitlements.mac.plist" ]; then
        log_ok "$app: entitlements.mac.plist ✓"
      else
        log_warn "$app: build/entitlements.mac.plist MISSING"
      fi
      if [ -f "$app_dir/scripts/notarize.js" ]; then
        log_ok "$app: scripts/notarize.js ✓"
      else
        log_warn "$app: scripts/notarize.js MISSING"
      fi
    else
      log_warn "$app: package directory not found (may not be built yet)"
    fi
  done
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  local cmd="${1:-}"

  case "$cmd" in
    --mac)
      verify_mac_certificate && export_mac_certificate
      ;;
    --win)
      verify_win_certificate "${2:-}"
      ;;
    --verify)
      verify_mac_certificate || true
      verify_secrets_checklist
      ;;
    *)
      echo "SoftwareHub Code Signing Setup (SEC-SH-002)"
      echo ""
      echo "Usage:"
      echo "  $0 --verify          Verify current signing setup and list required secrets"
      echo "  $0 --mac             Export macOS Developer ID certificate for CI/CD"
      echo "  $0 --win <cert.pfx>  Export Windows Authenticode certificate for CI/CD"
      echo ""
      verify_secrets_checklist
      ;;
  esac
}

main "$@"
