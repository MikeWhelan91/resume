# Stripe Integration Setup Guide

Your TailoredCV app already has a solid Stripe integration! Here's how to complete the setup and manage subscriptions effectively.

## 🚀 Current Integration Status

✅ **Already Implemented:**
- Checkout sessions for subscriptions and one-time payments
- Webhook handling for subscription lifecycle
- Customer portal integration
- Account management UI
- Plan switching and cancellation flows

## 🔧 Stripe Dashboard Setup

### 1. Create Products & Prices

In your Stripe Dashboard, create these products:

**Pro Monthly**
- Product Name: "TailoredCV Pro Monthly"
- Price: €9.99/month
- Billing: Recurring monthly
- Copy the Price ID → `STRIPE_PRICE_PRO_MONTHLY`

**Pro Annual** 
- Product Name: "TailoredCV Pro Annual"  
- Price: €69/year (€5.75/month equivalent)
- Billing: Recurring yearly
- Copy the Price ID → `STRIPE_PRICE_PRO_ANNUAL`

**Day Pass**
- Product Name: "TailoredCV Day Pass"
- Price: €2.99 one-time
- Billing: One-time payment
- Copy the Price ID → `STRIPE_PRICE_DAY_PASS`

### 2. Configure Customer Portal

Go to Settings → Customer Portal in your Stripe Dashboard:

**Business Information:**
- Business name: "TailoredCV"
- Support email: your-support@tailoredcv.app
- Privacy policy URL: https://tailoredcv.app/privacy
- Terms of service URL: https://tailoredcv.app/terms

**Functionality:**
- ✅ Update payment methods
- ✅ Download invoices  
- ✅ Update billing details
- ✅ View subscription details
- ✅ Cancel subscriptions (enable with confirmation)

**Products:**
- Add all your products so customers can upgrade/downgrade

### 3. Set Up Webhooks

Create a webhook endpoint in Stripe Dashboard:

**Endpoint URL:** `https://yourdomain.com/api/stripe/webhook`

**Events to Listen For:**
```
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
```

Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## 🔐 Environment Variables

Add these to your `.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from Stripe Dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_DAY_PASS=price_...

# Your app URLs
APP_URL=https://tailoredcv.app
SUPPORT_EMAIL=support@tailoredcv.app
```

## 🎯 How It Works

### Customer Journey

1. **Sign Up**: User creates account via OAuth
2. **Choose Plan**: User clicks upgrade button
3. **Checkout**: Stripe Checkout handles payment
4. **Webhook**: Stripe notifies your app of successful payment
5. **Entitlement**: User's plan is activated in database
6. **Portal**: User can manage billing via Stripe Customer Portal

### Subscription Management Flow

```
Free User → Checkout → Payment → Webhook → Pro Features Activated
Pro User → Portal → Modify → Webhook → Features Updated  
Pro User → Cancel → Portal → Webhook → Downgrade at period end
```

## 📋 Testing Your Integration

### 1. Test Checkout Flow

Use Stripe test cards:
- Success: `4242424242424242`
- Declined: `4000000000000002`
- 3D Secure: `4000002500003155`

### 2. Test Webhooks Locally

Install Stripe CLI:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 3. Test Customer Portal

1. Create a test subscription
2. Go to `/account` page
3. Click "Manage Billing"
4. Verify portal opens with correct options

## 🛠️ Common Management Tasks

### Adding New Plans

1. **Stripe Dashboard**: Create new product/price
2. **Environment**: Add price ID to `.env.local`
3. **Checkout**: Update `checkout.js` with new plan logic
4. **Webhook**: Update webhook to handle new plan type
5. **UI**: Add new plan to pricing page

### Handling Failed Payments

Your webhook already handles this:
- `invoice.payment_failed` → Sets status to `past_due`
- Features are disabled until payment succeeds
- Stripe automatically retries failed payments

### Subscription Cancellations

Two types handled:
- **Immediate**: Subscription ends immediately
- **End of period**: Subscription continues until period end

Your webhook handles both scenarios automatically.

### Upgrading/Downgrading

Customers can:
1. Use Customer Portal for self-service changes
2. Cancel current subscription and start new one
3. Prorated billing is handled by Stripe automatically

## 🔍 Monitoring & Analytics

### Key Metrics to Track

1. **Conversion Rate**: Free trial → Paid subscription
2. **Churn Rate**: Monthly/Annual cancellations  
3. **MRR/ARR**: Monthly/Annual Recurring Revenue
4. **ARPU**: Average Revenue Per User

### Stripe Dashboard Analytics

Monitor:
- Revenue trends
- Failed payment rates
- Customer retention
- Popular plans

### Custom Analytics

Track in your database:
- Plan distribution
- Feature usage by plan
- Upgrade/downgrade patterns

## 🚨 Important Notes

### Security
- Never expose secret keys in frontend code
- Validate all webhook signatures
- Use HTTPS for all Stripe interactions

### Error Handling
- Your portal.js already handles portal configuration errors
- Implement retry logic for critical webhook events
- Log all Stripe API errors for debugging

### Compliance
- Handle EU VAT if selling to European customers
- Implement proper data retention policies
- Follow PCI compliance guidelines

## 🎉 Your Integration is Ready!

Your Stripe setup is already production-ready! Just need to:

1. ✅ Add environment variables
2. ✅ Configure Stripe Dashboard  
3. ✅ Set up webhook endpoint
4. ✅ Test the flow
5. ✅ Go live!

The code you have handles all the complex subscription logic, webhooks, and customer management automatically. Great work! 🚀