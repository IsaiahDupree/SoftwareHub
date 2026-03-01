# Key Rotation Procedure

## Environment Variables Requiring Rotation

### Critical (Rotate immediately if compromised)
1. **SUPABASE_SERVICE_ROLE_KEY** - Full database access
2. **STRIPE_SECRET_KEY** - Payment processing
3. **STRIPE_WEBHOOK_SECRET** - Webhook verification

### Important (Rotate quarterly)
4. **RESEND_API_KEY** - Email sending
5. **MUX_TOKEN_SECRET** - Video processing
6. **S3_SECRET_ACCESS_KEY** - File storage

## Rotation Steps

### 1. Generate New Keys
- Supabase: Dashboard > Settings > API > Regenerate service role key
- Stripe: Dashboard > Developers > API Keys > Roll key
- Resend: Dashboard > API Keys > Create new key

### 2. Update Environment
- Update `.env.local` for local development
- Update Vercel environment variables for production
- Update CI/CD secrets in GitHub Actions

### 3. Deploy and Verify
- Deploy with new keys
- Test critical paths: auth, payments, email
- Monitor error logs for auth failures

### 4. Revoke Old Keys
- Only after verifying new keys work
- Revoke in the respective service dashboards
