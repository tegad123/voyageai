# Payment System Setup Guide

## ✅ What's Already Done

1. **Rate Limit System**
   - Changed from 30 to 40 free requests per week
   - Changed terminology from "messages" to "requests"
   - Limit displays as "Limited" instead of showing the number

2. **UI Updates**
   - Cancel subscription button only shows for paying subscribers
   - All translations updated (English & Albanian)
   - Upgrade modal triggers actual purchase flow
   - Apple Pay integration ready in code

3. **Code Implementation**
   - `react-native-iap` package installed
   - `purchaseService.ts` created with all IAP logic
   - Purchase listeners and error handling
   - Restore purchases functionality
   - Loading states and user feedback

## 🔧 What You Need to Do in App Store Connect

### Step 1: Create In-App Purchase Product

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app **VoyageAI**
3. Go to **Features** → **In-App Purchases**
4. Click the **+** button to create a new In-App Purchase
5. Select **Auto-Renewable Subscription**

### Step 2: Configure the Subscription

**Product ID:** `com.jmotech.voyageai.premium.weekly`
(⚠️ Must match exactly what's in the code)

**Reference Name:** `Premium Weekly Subscription`

**Subscription Group:** Create new group called "Premium Access"

**Duration:** 1 Week

**Price:** 
- **US:** $2.99
- **Albania:** 280 Lek
- Other countries: Apple will suggest equivalent pricing

### Step 3: Add Subscription Information

**Display Name (English):** `Premium Weekly Access`

**Display Name (Albanian):** `Qasja Premium Javore`

**Description (English):**
```
Unlock unlimited AI travel planning with Premium:
• Unlimited AI requests
• Create unlimited itineraries
• Priority support
• Advanced travel features

Subscription renews weekly. Cancel anytime.
```

**Description (Albanian):**
```
Zhbllokoni planifikimin e pakufizuar të udhëtimeve me Premium:
• Kërkesa AI të pakufizuara
• Krijo itinerare të pakufizuara
• Mbështetje me përparësi
• Veçori të avancuara udhëtimi

Abonimi rinovohet çdo javë. Anulo në çdo kohë.
```

### Step 4: App Privacy Information

**Subscription Features:**
- Unlimited AI-powered travel planning
- Unlimited itinerary creation
- Priority customer support
- Access to advanced features

**Data Collection:** None (subscription only unlocks features)

### Step 5: Save & Submit for Review

1. Click **Save**
2. Submit the In-App Purchase for review
3. ⚠️ **Important**: The subscription won't work until Apple approves it

### Step 6: Test Before Going Live

1. In App Store Connect, create a **Sandbox Tester** account
2. Go to **Users and Access** → **Sandbox Testers**
3. Create a test account with email like `test@example.com`
4. On your iOS device:
   - Go to Settings → App Store → Sandbox Account
   - Sign in with your test account
5. Test the purchase flow in your app (it won't charge real money)

## 📱 How It Works in the App

### User Flow:

1. User hits 40 request limit → Upgrade modal appears
2. User taps "Upgrade to Premium" → Apple Pay sheet appears
3. User completes payment with Face ID/Touch ID
4. Purchase confirmed → User gets unlimited access
5. Subscription auto-renews weekly at $2.99/280 Lek

### Cancel Flow:

1. Premium users see "Cancel Subscription" button in Profile
2. Tap cancel → Confirmation modal appears
3. Confirm → Subscription cancelled at period end
4. User keeps premium until billing period ends
5. Then reverts to free plan (40 requests/week)

## 🔒 Revenue & Taxes

- **Apple's Cut:** 30% first year, 15% after year 1
- **Your Net:** ~$2.09/week per subscriber (first year)
- **Taxes:** Apple handles VAT/GST collection
- **Payouts:** Monthly, requires banking info in App Store Connect

## ⚠️ Important Notes

1. **Product ID must be EXACT:** `com.jmotech.voyageai.premium.weekly`
2. **Test thoroughly** with Sandbox before launching
3. **Subscription won't work** until Apple approves it (usually 24-48 hours)
4. **Don't change Product ID** once it's live (users will lose access)
5. **Bundle ID must match:** `com.jmotech.voyageai` (already configured)

## 🐛 Troubleshooting

### "No products available"
- Product not yet approved by Apple
- Product ID mismatch in code vs App Store Connect
- Subscription not added to correct app

### "Payment sheet doesn't appear"
- Test with Sandbox account, not real Apple ID
- Ensure device is signed into Sandbox in Settings
- Check console logs for IAP errors

### "Purchase completed but user still rate-limited"
- Need to implement server-side receipt validation
- Currently just testing the UI flow
- Will need backend endpoint to verify purchases

## 📝 Next Steps After This Is Done

1. **Server-Side Receipt Validation:**
   - Add endpoint to verify Apple receipts
   - Update user's premium status in database
   - Sync with rate limit middleware

2. **Webhook for Subscription Events:**
   - Handle subscription renewals
   - Handle subscription cancellations
   - Handle refunds

3. **Analytics:**
   - Track conversion rates
   - Monitor churn
   - A/B test pricing

---

**Need Help?** 
- Apple's IAP Guide: https://developer.apple.com/in-app-purchase/
- Contact me if you run into issues!

