# Deployment Guide

## Prerequisites
- Node.js 20+
- Vercel account (recommended) or Docker
- Supabase project (production)
- Stripe account with webhook configured

## Environment Variables
Set all variables from `.env.local` in your deployment platform.
Required for production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`

## Vercel Deployment
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy from `main` branch
4. Configure custom domain
5. Set up Stripe webhook to `https://yourdomain.com/api/stripe/webhook`

## Docker Deployment
1. Build: `docker build -t softwarehub .`
2. Run: `docker-compose up -d`
3. Configure reverse proxy (nginx/caddy) for SSL

## Database Migration
1. Link Supabase project: `supabase link --project-ref YOUR_REF`
2. Push migrations: `supabase db push`

## Post-Deploy Checklist
- [ ] Verify health endpoint: `GET /api/health`
- [ ] Test authentication flow
- [ ] Test Stripe webhook (use Stripe CLI)
- [ ] Verify email sending (Resend)
- [ ] Check error tracking
