# OAuth Setup Guide for VoyageAI

This guide will help you set up Google Sign-In and Apple Sign-In with Supabase.

---

## Prerequisites

1. **Supabase Project** - https://supabase.com/dashboard
2. **Google Cloud Console** - https://console.cloud.google.com
3. **Apple Developer Account** - https://developer.apple.com (for Apple Sign-In)

---

## 1. Supabase Configuration

### Enable OAuth Providers

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/providers
2. Enable **Google** provider:
   - Copy your **Web Client ID** and **iOS Client ID** from Google Cloud Console
   - Paste into Supabase Google provider settings
3. Enable **Apple** provider:
   - You'll need your Apple Service ID, Team ID, and private key (see Apple setup below)

---

## 2. Google Sign-In Setup

### A. Google Cloud Console Setup

1. Go to https://console.cloud.google.com
2. Create or select your project
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**

#### Create **Web Application** Credentials (for Supabase)
- Application type: **Web application**
- Name: `VoyageAI Web`
- Authorized redirect URIs:
  ```
  https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
  ```
- Copy the **Client ID** and **Client Secret**
- Add these to your Supabase Google provider settings

#### Create **iOS** Credentials
- Application type: **iOS**
- Name: `VoyageAI iOS`
- Bundle ID: `com.jmotech.voyageai` (from your app.config.js)
- Copy the **iOS Client ID**

### B. Update app.config.js

Your current config already has:
```javascript
webClientId: '752889489358-jt5k4art15l82aan1ti4qmi40p8mu92t.apps.googleusercontent.com',
iosClientId: '752889489358-bmqnb6mfha7qbkfnfd2trfp4i7fq27jd.apps.googleusercontent.com',
```

✅ If these IDs are from your Google project, you're all set!
❌ If not, replace them with your own Client IDs

### C. Add Google Sign-In to Supabase

1. Go to Supabase → Authentication → Providers → Google
2. Enable Google provider
3. Enter your **Web Client ID** (not iOS client ID!)
4. Enter your **Client Secret**
5. Save

---

## 3. Apple Sign-In Setup

### A. Apple Developer Console Setup

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Create a **Services ID** (not App ID):
   - Identifier: `com.jmotech.voyageai.signin` (example)
   - Description: `VoyageAI Sign in with Apple`
   - Enable **Sign In with Apple**
   - Configure domains and return URLs:
     - Domains: `YOUR_PROJECT_REF.supabase.co`
     - Return URLs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

3. Create a **Private Key** for Sign in with Apple:
   - Go to **Keys** section
   - Create a new key
   - Enable **Sign in with Apple**
   - Download the `.p8` key file (you can only download this once!)
   - Note the **Key ID**

4. Find your **Team ID**:
   - Go to Apple Developer → Membership
   - Copy your Team ID

### B. Add Apple Sign-In to Supabase

1. Go to Supabase → Authentication → Providers → Apple
2. Enable Apple provider
3. Enter:
   - **Service ID**: `com.jmotech.voyageai.signin` (from step A)
   - **Team ID**: Your 10-character Team ID
   - **Key ID**: From your private key
   - **Private Key**: Paste the entire contents of your `.p8` file
4. Save

### C. Configure Your iOS App

✅ Your `app.config.js` already has:
```javascript
entitlements: {
  'com.apple.developer.applesignin': ['Default']
}
```

✅ Your `VoyageAI.entitlements` file is correct

### D. App ID Configuration

1. Go to Apple Developer → Identifiers
2. Find or create your App ID: `com.jmotech.voyageai`
3. Enable **Sign In with Apple** capability
4. Save

---

## 4. Testing

### Google Sign-In Testing
- ✅ Works on both iOS Simulator and real device
- ✅ Works in Expo Go (limited)
- ✅ Best tested in development build or production

### Apple Sign-In Testing
- ❌ Does NOT work in Expo Go
- ❌ Does NOT work in iOS Simulator
- ✅ **Only works on a real iOS device** with a signed build
- ✅ You must build with EAS or Xcode

---

## 5. Build and Test

### Rebuild Your App

Since you changed `app.config.js`, you need to rebuild:

```bash
# Build for iOS
eas build --platform ios --profile development

# Or build locally
npx expo run:ios
```

### Test Flow

1. **Google Sign-In**:
   - Tap "Google" button
   - Should open Google sign-in browser
   - Select account
   - Redirects back to app ✅

2. **Apple Sign-In** (real device only):
   - Tap "Apple" button
   - iOS native Apple ID prompt appears
   - Face ID / Touch ID authentication
   - Redirects back to app ✅

---

## 6. Troubleshooting

### Google Sign-In Errors

**Error**: "DEVELOPER_ERROR"
- **Fix**: Verify your Web Client ID in Google Cloud Console matches what's in `app.config.js`

**Error**: "SIGN_IN_CANCELLED"
- **Fix**: User cancelled - this is normal

**Error**: "SIGN_IN_REQUIRED"
- **Fix**: Configure Google Sign-In in your Supabase project

### Apple Sign-In Errors

**Error**: "ERR_REQUEST_UNKNOWN"
- **Fix**: Must test on a real device, not simulator
- **Fix**: Ensure App ID has Sign In with Apple capability enabled
- **Fix**: Verify Supabase Apple provider is configured correctly

**Error**: "ERR_CANCELED"
- **Fix**: User cancelled - this is normal

**Error**: "ERR_INVALID_RESPONSE"
- **Fix**: Check that your Services ID return URLs match your Supabase project URL exactly

---

## 7. Current Configuration Status

✅ **App Config**: Google & Apple plugins enabled
✅ **iOS Entitlements**: Apple Sign-In capability added
✅ **Client IDs**: Already in app.config.js

❓ **TO CHECK**:
1. Are your Google Client IDs in Supabase?
2. Is Apple provider configured in Supabase?
3. Have you enabled Sign In with Apple on your App ID in Apple Developer Console?

---

## 8. Quick Checklist

Before testing, ensure:

- [ ] Supabase Google provider enabled with Web Client ID + Secret
- [ ] Supabase Apple provider enabled with Service ID, Team ID, Key ID, and Private Key
- [ ] Apple Developer: Services ID created with correct return URLs
- [ ] Apple Developer: App ID has Sign In with Apple enabled
- [ ] App rebuilt with `eas build` or `expo run:ios`
- [ ] Testing on **real iOS device** (for Apple Sign-In)

---

## Need Help?

If you're still getting errors, share:
1. The exact error message
2. Whether you're testing on simulator or real device
3. Screenshots of your Supabase provider configuration

