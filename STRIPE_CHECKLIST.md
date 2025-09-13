# 🚀 Stripe Setup Checklist

## Phase 1: Stripe Dashboard Setup (30 minutes)

### 1. Products & Prices
- [ ] Create "Pro Monthly" product (€9.99/month recurring)
- [ ] Create "Pro Annual" product (€69/year recurring) 
- [ ] Create "Day Pass" product (€2.99 one-time)
- [ ] Copy all Price IDs to your environment variables

### 2. Customer Portal
- [ ] Go to Settings > Customer Portal
- [ ] Add business information (name, support email, URLs)
- [ ] Enable: Update payment methods, Download invoices, Cancel subscriptions
- [ ] Add all products for plan switching
- [ ] Test portal functionality

### 3. Webhooks
- [ ] Create webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Add events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- [ ] Copy webhook signing secret
- [ ] Test webhook delivery

## Phase 2: Environment Configuration (5 minutes)

Add to your `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_DAY_PASS=price_...
APP_URL=https://yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
```

## Phase 3: Testing (20 minutes)

### Test Accounts
- [ ] Create test customer in Stripe Dashboard
- [ ] Test checkout flow with test card: `4242424242424242`
- [ ] Verify webhook events are received
- [ ] Test customer portal access
- [ ] Test subscription cancellation

### Test Cards
```
Success: 4242424242424242
Decline: 4000000000000002
3D Secure: 4000002500003155
```

## Phase 4: Go Live (10 minutes)

### Switch to Live Mode
- [ ] Toggle to Live mode in Stripe Dashboard
- [ ] Update environment variables with live keys
- [ ] Test one real transaction (can refund immediately)
- [ ] Verify live webhook endpoint works
- [ ] Monitor dashboard for any issues

## 🎯 Your Integration Features

✅ **Subscription Management**
- Monthly and annual Pro plans
- One-time Day Pass purchases
- Automatic plan activation via webhooks
- Customer portal for self-service billing

✅ **Payment Processing**
- Secure Stripe Checkout
- 3D Secure support
- Failed payment handling
- Automatic retries

✅ **Customer Experience**
- Seamless upgrade flow
- Billing history access  
- Easy cancellation
- Prorated plan changes

✅ **Developer Experience**
- Comprehensive webhook handling
- Error logging and monitoring
- Test mode support
- Idempotent operations

## 🔍 Verification Steps

After setup, verify these work:

1. **Free to Pro upgrade** → User gets unlimited access
2. **Subscription cancellation** → User keeps access until period end
3. **Failed payment** → User loses access, gets notified  
4. **Webhook failures** → Check logs, implement retry if needed
5. **Customer portal** → All billing functions work correctly

## 🚨 Production Considerations

### Security
- [ ] Webhook signatures validated
- [ ] API keys secured (never in frontend)
- [ ] HTTPS enforced for all Stripe interactions

### Monitoring
- [ ] Set up Stripe Dashboard alerts
- [ ] Monitor webhook delivery success rates
- [ ] Track key metrics (MRR, churn, conversion)

### Support
- [ ] Document common billing issues
- [ ] Train support team on Stripe Customer Portal
- [ ] Set up refund/billing adjustment processes

## 🎉 You're Ready!

Once all checkboxes are ticked, your Stripe integration is production-ready!

Your existing code already handles:
- ✅ Complex subscription logic
- ✅ Webhook event processing  
- ✅ Customer lifecycle management
- ✅ Error handling and recovery
- ✅ Security best practices

Just configure Stripe Dashboard and add environment variables! 🚀