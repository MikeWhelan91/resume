# TailorCV - Setup Guide

## Quick Start

1. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure your `.env.local` file with actual values:**

### Required Environment Variables

```env
# Database URLs (Neon)
DATABASE_URL="your_neon_pooled_connection_string"
DIRECT_URL="your_neon_direct_connection_string"

# NextAuth Configuration  
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email Configuration (Resend recommended)
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="your_resend_api_key"
EMAIL_FROM="noreply@yourdomain.com"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PRICE_PRO="price_your_pro_monthly_price_id"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# App Configuration
APP_URL="http://localhost:3000"

# OpenAI API Key
OPENAI_API_KEY="your_openai_api_key"
```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Stripe Setup

1. Create products in Stripe Dashboard:
   - Pro Monthly subscription
   - Copy the price ID to `STRIPE_PRICE_PRO`

2. Set up webhook endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## Email Setup (Resend)

1. Create account at https://resend.com
2. Add and verify your domain
3. Create API key and add to `EMAIL_SERVER_PASSWORD`
4. Set `EMAIL_FROM` to your verified email address

## Local Testing with Stripe

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Use test cards: https://stripe.com/docs/testing

## Features

### Free Plan
- PDF resume export
- Basic rate limiting (10 requests/minute)
- Resume generation and tailoring

### Pro Plan  
- All free features
- DOCX resume export
- Cover letter generation
- Higher rate limits (60 requests/minute)
- Stripe billing management

## Authentication Flow

1. **Sign Up/In**: Magic link via email
2. **Free User**: Default entitlement created
3. **Upgrade**: Stripe Checkout → Webhook → Entitlement updated
4. **Billing**: Stripe Customer Portal for subscription management

## API Routes

- `/api/auth/[...nextauth]` - NextAuth endpoints
- `/api/stripe/checkout` - Create Stripe checkout session
- `/api/stripe/portal` - Create billing portal session  
- `/api/stripe/webhook` - Handle Stripe webhooks
- `/api/export-docx` - DOCX export (Pro only)
- `/api/download-cover-letter` - Cover letter PDF (Pro only)
- `/api/user/entitlement` - Get user entitlement

## Database Schema

- **User**: Auth data + Stripe customer ID
- **Entitlement**: Plan, status, features per user
- **Account/Session**: NextAuth tables
- **WebhookEvent**: Idempotency for Stripe webhooks

## Security Notes

- Server-side entitlement checks in all Pro routes
- Rate limiting by authenticated user ID
- Webhook signature verification
- No client-side plan validation

## Deployment

1. **Database**: Use Neon pooled connection for runtime, direct for migrations
2. **App**: Deploy to Vercel/Render with environment variables
3. **Stripe**: Update webhook URL to production domain
4. **Email**: Switch to production email provider (Resend/SES)