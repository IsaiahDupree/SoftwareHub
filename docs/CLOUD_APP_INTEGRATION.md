# Cloud App Integration Guide

This guide explains how to integrate SoftwareHub SSO (Single Sign-On) into a cloud/web application that is sold as a package on SoftwareHub.

---

## Overview

Cloud applications use a token-based SSO flow:

1. **User clicks "Open App"** on SoftwareHub package page
2. **SoftwareHub generates** a one-time SSO token (valid 5 minutes)
3. **User is redirected** to the cloud app with the token as a query parameter
4. **Cloud app calls** `/api/cloud-sso/verify` to validate the token
5. **Cloud app receives** user info and entitlements
6. **Cloud app creates** a local session for the user

---

## SSO Flow Diagram

```
User                SoftwareHub             Cloud App
  |                      |                      |
  |-- Click "Open" ----->|                      |
  |                      |-- Generate token --->|
  |                      |                      |
  |<---- Redirect with ?sso_token=eyJ... ------>|
  |                      |                      |
  |                      |<-- POST /verify -----|
  |                      |--- User + entitlements -->|
  |                      |                      |
  |<----- App session established --------------|
```

---

## Step 1: Configure Your Cloud App in SoftwareHub

In the SoftwareHub admin panel, create a package with:
- **Type:** `CLOUD_APP`
- **Cloud App URL:** `https://yourcloudapp.com` (the base URL of your app)

The SSO redirect will append `?sso_token=...` to this URL.

---

## Step 2: Handle the SSO Redirect

When a user arrives at your app with an `sso_token` query parameter, verify it server-side.

**Important:** Never trust the token without server-side verification. The token is one-time use and expires after 5 minutes.

### Example (Node.js/Express):

```javascript
app.get('/', async (req, res) => {
  const ssoToken = req.query.sso_token;

  if (!ssoToken) {
    // Normal app access — check for existing session
    return handleNormalAccess(req, res);
  }

  // Verify the SSO token with SoftwareHub
  const response = await fetch('https://yourdomain.com/api/cloud-sso/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: ssoToken }),
  });

  const data = await response.json();

  if (!data.valid) {
    return res.status(401).send('Invalid or expired SSO token');
  }

  // Create a session for the user
  req.session.user = {
    id: data.user.id,
    email: data.user.email,
    name: data.user.full_name,
    avatar: data.user.avatar_url,
    entitlements: data.entitlements,
  };

  // Redirect to remove the token from the URL
  return res.redirect('/dashboard');
});
```

### Example (Python/Flask):

```python
@app.route('/')
def index():
    sso_token = request.args.get('sso_token')

    if not sso_token:
        return handle_normal_access()

    response = requests.post(
        'https://yourdomain.com/api/cloud-sso/verify',
        json={'token': sso_token}
    )
    data = response.json()

    if not data.get('valid'):
        abort(401, 'Invalid or expired SSO token')

    session['user'] = {
        'id': data['user']['id'],
        'email': data['user']['email'],
        'name': data['user']['full_name'],
        'entitlements': data['entitlements'],
    }

    return redirect('/dashboard')
```

---

## Step 3: Verify Endpoint Details

**Endpoint:** `POST /api/cloud-sso/verify`

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "avatar_url": "https://..."
  },
  "package_id": "package-uuid",
  "entitlements": [
    "package-uuid-1",
    "package-uuid-2"
  ]
}
```

**Error Responses:**

| Status | Error | Meaning |
|--------|-------|---------|
| 401 | `Invalid or expired SSO token` | Token expired (>5 min) or malformed |
| 401 | `Token has already been used` | One-time use violation |
| 400 | Validation error | Malformed request |

---

## Step 4: Session Management

After verifying the SSO token, create a session in your application:

1. **Store user info** — Use the `user.id` as the primary identifier
2. **Store entitlements** — The `entitlements` array contains package IDs the user has access to
3. **Set session duration** — Recommended: 24 hours, then require re-authentication
4. **Handle re-entry** — If the user comes back via SSO while already logged in, refresh their session

### Session Expiry Strategy

```
On each request:
  if session exists and not expired:
    serve the request
  else if sso_token in URL:
    verify token and create new session
  else:
    redirect to: https://yourdomain.com/app/packages
    (user can click "Open App" again to get a new SSO token)
```

---

## Step 5: Using Entitlements

The `entitlements` array contains package IDs that the user has access to. Use this to gate features:

```javascript
function hasAccess(entitlements, requiredPackageId) {
  return entitlements.includes(requiredPackageId);
}

// Example: Premium feature gating
if (hasAccess(session.user.entitlements, 'premium-package-uuid')) {
  showPremiumFeatures();
} else {
  showUpgradePrompt();
}
```

---

## SSO Token JWT Structure

The SSO token is a standard JWT (HS256) with these claims:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "pid": "package-uuid",
  "ents": ["package-uuid-1", "package-uuid-2"],
  "jti": "random-uuid",
  "iat": 1707609600,
  "exp": 1707609900
}
```

**Do not decode/verify this token client-side.** Always use the `/api/cloud-sso/verify` endpoint for server-side verification. The token is one-time use — only the first verification call succeeds.

---

## Security Considerations

1. **Always verify server-side** — Never trust the token on the client
2. **One-time use** — Each token can only be verified once
3. **Short-lived** — Tokens expire after 5 minutes
4. **HTTPS only** — Always use HTTPS for the redirect URL
5. **Remove token from URL** — After verification, redirect to remove the `sso_token` parameter from the browser URL bar
6. **Validate origin** — Optionally check that the referrer is your SoftwareHub domain

---

## Re-authentication

When a user's session expires in your cloud app:

**Option A: Redirect to SoftwareHub**
```javascript
// Redirect user to their packages page
window.location.href = 'https://yourdomain.com/app/packages';
```

**Option B: Silent re-auth (if user has SoftwareHub session)**
```javascript
// Open in a hidden iframe or popup
const popup = window.open(
  'https://yourdomain.com/api/cloud-sso/generate?package_id=xxx&redirect=true',
  '_blank',
  'width=1,height=1'
);
```

Option A is recommended for simplicity.

---

## Testing

1. **Create a test package** in admin with type `CLOUD_APP`
2. **Set the cloud app URL** to your local development URL (e.g., `http://localhost:3000`)
3. **Purchase or grant entitlement** to a test user
4. **Click "Open App"** on the package page
5. **Verify the SSO flow** in your local app

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid or expired SSO token" | Token is >5 minutes old; user needs to click "Open App" again |
| "Token has already been used" | Don't retry verification; create a new token |
| Missing entitlements | Check that user has `package_entitlements` with `has_access = true` |
| Wrong redirect URL | Update the Cloud App URL in admin package settings |
| CORS errors | The verify endpoint accepts requests from any origin (server-to-server) |
