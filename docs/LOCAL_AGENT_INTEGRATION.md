# Local Agent Integration Guide

This guide explains how to integrate license activation and validation into a native desktop application (macOS, Windows, Linux) that communicates with SoftwareHub.

---

## Overview

The license flow for local/desktop applications:

1. **User purchases** a package on SoftwareHub
2. **License key** is generated and shown on the user's Licenses page
3. **User enters** the license key in the desktop app
4. **App calls** `/api/licenses/activate` with the key and a device identifier
5. **App receives** a JWT activation token (valid 30 days)
6. **App stores** the token locally and periodically validates it
7. **On each launch**, app calls `/api/licenses/validate` to confirm access

---

## Step 1: Collect the License Key

Present the user with a text field to enter their license key. Keys follow the format:

```
XXXX-XXXX-XXXX-XXXX
```

Characters used: `A-H, J-N, P-Z, 2-9` (excludes 0, O, 1, I, L to avoid confusion).

Normalize input before sending:
- Trim whitespace
- Convert to uppercase
- Accept with or without dashes

---

## Step 2: Generate a Device ID

Create a stable, unique identifier for the device. This should remain consistent across app restarts.

**Recommended approach (macOS):**
```swift
import IOKit

func getDeviceId() -> String {
    let service = IOServiceGetMatchingService(kIOMainPortDefault,
        IOServiceMatching("IOPlatformExpertDevice"))
    let uuid = IORegistryEntryCreateCFProperty(service,
        "IOPlatformUUID" as CFString, kCFAllocatorDefault, 0)
    IOObjectRelease(service)
    return (uuid?.takeRetainedValue() as? String) ?? UUID().uuidString
}
```

**Recommended approach (cross-platform):**
- Combine machine ID + username into a hash
- Or use the OS hardware UUID

The device ID is hashed (SHA256) server-side before storage — you can send raw identifiers safely.

---

## Step 3: Activate the License

**Endpoint:** `POST /api/licenses/activate`

```bash
curl -X POST https://yourdomain.com/api/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "ABCD-EFGH-JKLM-NPQR",
    "device_id": "550e8400-e29b-41d4-a716-446655440000",
    "device_name": "MacBook Pro",
    "device_type": "desktop",
    "os_name": "macOS",
    "os_version": "15.0",
    "app_version": "1.2.0",
    "hardware_model": "MacBookPro18,1"
  }'
```

**Required fields:** `license_key`, `device_id`
**Optional fields:** `device_name`, `device_type`, `os_name`, `os_version`, `app_version`, `hardware_model`

**Success response (200):**
```json
{
  "activation_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2026-04-11T00:00:00.000Z",
  "device_id": "550e8400-...",
  "license_id": "uuid",
  "package_id": "uuid"
}
```

**Handle errors:**

| Status | Code | Action |
|--------|------|--------|
| 404 | — | Show "Invalid license key" |
| 403 | `LICENSE_INACTIVE` | Show "License is not active" |
| 403 | `LICENSE_EXPIRED` | Show "License has expired" |
| 403 | `DEVICE_LIMIT` | Show "Maximum devices reached. Deactivate a device at yourdomain.com/app/licenses" |
| 429 | — | Rate limited — wait and retry |

---

## Step 4: Store the Token

Store the activation token securely on the device:

| Platform | Storage Location |
|----------|-----------------|
| macOS | Keychain Services (`SecItemAdd`) |
| Windows | Windows Credential Manager |
| Linux | libsecret / GNOME Keyring |

**Store these values:**
- `activation_token` — the JWT string
- `expires_at` — token expiration timestamp
- `device_id` — the device ID used during activation
- `license_id` — for deactivation purposes

---

## Step 5: Validate on Launch

Call the validate endpoint each time the app launches (or periodically, e.g., daily).

**Endpoint:** `POST /api/licenses/validate`

```bash
curl -X POST https://yourdomain.com/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{
    "activation_token": "eyJhbGciOiJIUzI1NiIs...",
    "device_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Success response (200):**
```json
{
  "valid": true,
  "license_id": "uuid",
  "package_id": "uuid",
  "license_type": "perpetual",
  "expires_at": null
}
```

**Validation logic:**

```
if response.valid == true:
    if response.grace_period == true:
        show warning: "License expires soon. Renew at yourdomain.com"
        allow app to run
    else:
        allow app to run

if response.valid == false:
    switch response.code:
        case "TOKEN_INVALID":
            clear stored token
            prompt user to re-enter license key
        case "DEVICE_MISMATCH":
            clear stored token
            prompt user to re-activate
        case "LICENSE_REVOKED", "LICENSE_SUSPENDED":
            show error: "Your license has been revoked/suspended"
            disable app features
        case "LICENSE_EXPIRED":
            show error: "Your license has expired"
            prompt renewal
```

**Offline handling:**
- If the network is unavailable, allow the app to run if the stored token hasn't expired (check `expires_at` locally)
- Set a maximum offline period (e.g., 7 days) after which the app must validate online
- The activation token is a JWT — you can decode it locally to check expiration without network

---

## Step 6: Token Refresh

The activation token expires after 30 days. To refresh:

1. Call `/api/licenses/activate` again with the same `license_key` and `device_id`
2. This returns a fresh token without consuming a new device slot
3. Schedule refresh ~5 days before expiration

```
if token_expires_at - now < 5 days:
    call activate endpoint
    store new token
```

---

## Step 7: Deactivation

When the user wants to transfer their license to a new device, deactivate the current one.

**Endpoint:** `POST /api/licenses/deactivate`

```bash
curl -X POST https://yourdomain.com/api/licenses/deactivate \
  -H "Content-Type: application/json" \
  -d '{
    "activation_token": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

**Response (200):**
```json
{
  "deactivated": true,
  "remaining_devices": 1
}
```

After deactivation, clear the stored token and prompt the user to re-activate if needed.

---

## JWT Token Structure

The activation token is a standard JWT (HS256) with these claims:

```json
{
  "lid": "license-uuid",
  "pid": "package-uuid",
  "did": "sha256-hash-of-device-id",
  "uid": "user-uuid",
  "iat": 1707609600,
  "exp": 1710201600
}
```

You can decode this locally (without verification) to check expiration for offline use. Never verify the signature client-side — the secret is server-only.

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/licenses/activate` | 10 requests/hour per license key |
| `/api/licenses/validate` | 100 requests/hour per device |
| `/api/licenses/deactivate` | No specific limit |

---

## Example Flow (Swift/macOS)

```swift
struct LicenseManager {
    let baseURL = "https://yourdomain.com"
    let deviceId = getDeviceId()

    func activate(licenseKey: String) async throws -> ActivationResponse {
        let url = URL(string: "\(baseURL)/api/licenses/activate")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "license_key": licenseKey,
            "device_id": deviceId,
            "device_name": Host.current().localizedName ?? "Mac",
            "os_name": "macOS",
            "os_version": ProcessInfo.processInfo.operatingSystemVersionString,
            "app_version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        ])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw LicenseError.networkError
        }

        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(ActivationResponse.self, from: data)
        } else {
            let error = try JSONDecoder().decode(ErrorResponse.self, from: data)
            throw LicenseError.serverError(error.code ?? "UNKNOWN", error.error)
        }
    }

    func validate(token: String) async throws -> ValidationResponse {
        let url = URL(string: "\(baseURL)/api/licenses/validate")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "activation_token": token,
            "device_id": deviceId
        ])

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(ValidationResponse.self, from: data)
    }
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid license key" | Verify key format, check for typos, ensure uppercase |
| "Device limit exceeded" | User must deactivate a device at the web portal |
| "Token invalid" after update | App version change doesn't affect tokens; check device ID stability |
| Network timeout | Implement retry with exponential backoff; allow offline grace period |
| 429 rate limit | Reduce validation frequency; cache results locally |
