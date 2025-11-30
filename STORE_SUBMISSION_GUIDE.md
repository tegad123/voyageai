# App Store & Google Play Submission Guide

## Pre-Submission Checklist

### ✅ Both Platforms
- [ ] Test on real devices (not just emulator/simulator)
- [ ] Verify Google Sign-In works
- [ ] Verify Apple Sign-In works (iOS only - must test on real device)
- [ ] Test subscription flow ($1.99/week)
- [ ] Test rate limiting (40 requests/week)
- [ ] Test in Albanian language (default)
- [ ] Test creating multiple itineraries
- [ ] Verify backend is live: https://voyageai-backend.onrender.com
- [ ] All API keys are set in Render (Google Places, Mapbox, Pexels, Foursquare)

### ✅ iOS Specific
- [ ] Apple Developer Account active ($99/year)
- [ ] Bundle ID registered: `com.jmotech.voyageai`
- [ ] App created in App Store Connect (ID: 6749346763)
- [ ] Apple Sign-In configured in Apple Developer Console
- [ ] Service ID configured: `com.jmotech.voyageai.signin`
- [ ] Test on real iPhone (Apple Sign-In doesn't work in simulator)

### ✅ Android Specific
- [ ] Google Play Developer Account active ($25 one-time)
- [ ] App created in Google Play Console
- [ ] Package name: `com.jmotech.voyageai`
- [ ] Google Sign-In OAuth client configured
- [ ] SHA-1 fingerprints added for both debug and release
- [ ] Privacy Policy URL ready
- [ ] Service account created for automated submission (optional)

---

## iOS Submission to App Store

### Step 1: Build iOS App

```bash
# Login to Expo
npx eas-cli login

# Build for iOS App Store
eas build --platform ios --profile production

# This will:
# - Ask for Apple credentials (tegad8@gmail.com)
# - Build the app on Expo servers
# - Take 15-30 minutes
# - Generate an .ipa file
```

### Step 2: Submit to App Store (Automated)

```bash
# Submit directly to App Store Connect
eas submit --platform ios --profile production --latest

# This will:
# - Use the latest production build
# - Upload to App Store Connect automatically
# - Use credentials from eas.json:
#   - appleId: tegad8@gmail.com
#   - ascAppId: 6749346763
#   - appleTeamId: RX4AK5B292
```

### Step 3: Complete App Store Connect Setup

1. Go to: https://appstoreconnect.apple.com
2. Select your app: **VoyageAI** (ID: 6749346763)
3. Fill in required information:
   - **App Name**: VoyageAI
   - **Subtitle**: AI-Powered Travel Planning
   - **Description**: 
     ```
     VoyageAI is your intelligent travel companion that creates personalized itineraries using advanced AI. 
     Simply tell us where you want to go, and we'll plan your perfect trip with hotels, restaurants, 
     activities, and more - all with real photos and reviews.

     Features:
     • AI-powered itinerary generation
     • Real venue photos and reviews
     • Interactive maps
     • Albanian language support
     • Save and manage multiple trips
     • Google and Apple Sign-In
     ```
   - **Keywords**: travel, trip planner, itinerary, AI, vacation, holiday, Albania
   - **Category**: Travel
   - **Privacy Policy URL**: (You need to provide this)
   - **Support URL**: (Your support website/email)
   - **Marketing URL**: (Optional)

4. **Screenshots** (Required - use iOS simulator):
   - 6.7" Display (iPhone 15 Pro Max): 3-10 screenshots
   - 5.5" Display (iPhone 8 Plus): 3-10 screenshots
   - Recommended: Chat screen, Itinerary screen, Map view, Profile screen

5. **App Review Information**:
   - **Sign-in required**: Yes
   - **Demo account**: Provide test Google/Apple account for reviewers
   - **Notes**: "App requires internet connection. Test with: [provide demo destination]"

6. **Age Rating**: 4+ (No objectionable content)

7. **Pricing**: Free with in-app purchase ($1.99/week subscription)

8. **In-App Purchases**: 
   - Go to "In-App Purchases" section
   - Create subscription: "VoyageAI Premium"
   - Price: $1.99/week
   - Albanian price will auto-convert

9. Click **"Submit for Review"**

### Step 4: Review Process
- Apple typically reviews within 24-48 hours
- You'll receive email notifications about status
- If rejected, address issues and resubmit

---

## Android Submission to Google Play

### Step 1: Create Service Account (For Automated Submission)

1. Go to: https://console.cloud.google.com
2. Select your project (or create new one)
3. Go to: **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**:
   - Name: `voyageai-play-uploader`
   - Role: **Service Account User**
5. Click **Keys** → **Add Key** → **Create New Key** → **JSON**
6. Download the JSON file
7. Save it as: `/Users/tegaumukoro/Desktop/VoyageAI/google-play-service-account.json`

8. Go to: https://play.google.com/console
9. Go to: **Setup** → **API access**
10. Link the service account
11. Grant permissions: **Admin (all permissions)**

### Step 2: Build Android App

```bash
# Build for Google Play Store
eas build --platform android --profile production

# This will:
# - Build an .aab (Android App Bundle) file
# - Take 15-30 minutes
# - No signing required (EAS handles it)
```

### Step 3: Submit to Google Play (Automated)

```bash
# Submit to Internal Testing track
eas submit --platform android --profile production --latest

# This will:
# - Use the latest production build
# - Upload to Google Play Console automatically
# - Submit to "internal" track (for testing)
# - Use service account: google-play-service-account.json
```

**Note**: First submission must be manual. After that, automated submission works.

### Step 4: Manual First Submission (If Needed)

If automated submission fails (first time), do it manually:

1. Download the .aab file from EAS dashboard: https://expo.dev
2. Go to: https://play.google.com/console
3. Select **Create App**:
   - **App name**: VoyageAI
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free

4. Complete **Store Presence** → **Main store listing**:
   - **App name**: VoyageAI
   - **Short description** (80 chars):
     ```
     AI-powered travel planner. Create perfect itineraries in seconds.
     ```
   - **Full description** (4000 chars):
     ```
     VoyageAI is your intelligent travel companion that creates personalized itineraries using advanced AI. 
     Simply tell us where you want to go, and we'll plan your perfect trip with hotels, restaurants, 
     activities, and more - all with real photos and reviews.

     KEY FEATURES:
     ✈️ AI-Powered Planning - Tell us your destination and preferences, and our AI creates a detailed 
     itinerary tailored to you
     
     📸 Real Photos & Reviews - Every venue includes authentic photos and real user reviews from 
     Google Places and Foursquare
     
     🗺️ Interactive Maps - See all your destinations on an interactive map with route planning
     
     🇦🇱 Albanian Support - Full interface in Albanian language (default)
     
     💾 Save & Manage Trips - Save unlimited itineraries and access them anytime
     
     🔐 Secure Sign-In - Quick and safe login with Google or Apple
     
     ⚡ Fast & Easy - Get a complete multi-day itinerary in under 60 seconds

     PERFECT FOR:
     • Planning vacations and holidays
     • Business travel
     • Weekend getaways
     • Adventure trips
     • Cultural tours
     • Food and dining experiences

     HOW IT WORKS:
     1. Tell us where you want to go
     2. Share your preferences (budget, interests, travel style)
     3. Get a complete itinerary with hotels, restaurants, and activities
     4. View everything on an interactive map
     5. Save your trip for later

     PREMIUM FEATURES:
     Upgrade to VoyageAI Premium ($1.99/week) for unlimited itineraries.
     Free users get 40 requests per week.

     Download VoyageAI now and start planning your next adventure!
     ```
   - **App icon**: Upload `assets/images/Resizedlogo.png` (512x512)
   - **Feature graphic**: Create a 1024x500 banner (can use Canva)
   - **Screenshots**: 
     - Phone: At least 2 screenshots (up to 8)
     - 7-inch tablet: At least 2 screenshots (optional)
     - 10-inch tablet: At least 2 screenshots (optional)
   - **Category**: Travel & Local
   - **Tags**: Travel, Planning, AI, Itinerary
   - **Email**: tegad8@gmail.com
   - **Privacy Policy URL**: (You need to provide this)

5. Complete **Content Rating**:
   - Start questionnaire
   - Select: Travel & Reference
   - Answer questions (should be rated Everyone)

6. Complete **App Content**:
   - Privacy policy: Required (provide URL)
   - Ads: Do you have ads? No
   - App access: Sign-in required
   - Target audience: Everyone

7. Complete **Select Countries**:
   - Available in: All countries
   - Or select specific countries

8. Complete **Store Settings**:
   - App category: Applications
   - Tags: Optional

9. Go to **Release** → **Production** → **Create new release**:
   - Upload the .aab file
   - Release name: `1.0.4 (4)`
   - Release notes:
     ```
     Initial release of VoyageAI - Your AI-powered travel planning companion!

     Features:
     • AI-generated personalized itineraries
     • Real venue photos and reviews
     • Interactive maps
     • Albanian language support
     • Google and Apple Sign-In
     ```

10. Click **Review Release** → **Start rollout to Production**

### Step 5: Review Process
- Google typically reviews within 3-7 days
- First submission takes longer
- You'll receive email notifications about status
- If rejected, address issues and resubmit

---

## After Submission

### Monitor Status

**iOS**:
- Check: https://appstoreconnect.apple.com
- Status will change: Waiting for Review → In Review → Ready for Sale

**Android**:
- Check: https://play.google.com/console
- Status will change: Draft → In Review → Published

### Common Rejection Reasons

**iOS**:
1. Missing privacy policy
2. Sign-in doesn't work (test on real device first!)
3. App crashes or freezes
4. Missing demo account for reviewers
5. Subscription not properly configured

**Android**:
1. Missing privacy policy
2. Content rating incomplete
3. Store listing missing required fields
4. App crashes
5. Permissions not justified

---

## Quick Commands Reference

```bash
# iOS
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest

# Android  
eas build --platform android --profile production
eas submit --platform android --profile production --latest

# Both platforms at once
eas build --platform all --profile production
eas submit --platform all --profile production --latest

# Check build status
eas build:list

# View submission status
eas submit:list
```

---

## Troubleshooting

### Build Fails

**iOS**:
- Check Apple Developer account is active
- Verify bundle ID matches: `com.jmotech.voyageai`
- Check provisioning profiles

**Android**:
- Check package name matches: `com.jmotech.voyageai`
- Verify keystore is properly configured (EAS handles this)

### Submission Fails

**iOS**:
- Verify ascAppId: `6749346763`
- Check Apple ID: `tegad8@gmail.com`
- Ensure app exists in App Store Connect

**Android**:
- Check service account JSON is valid
- Verify app is created in Play Console
- First submission must be manual

---

## Need Help?

- **Expo Docs**: https://docs.expo.dev/submit/introduction/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **EAS Dashboard**: https://expo.dev

---

## Privacy Policy Requirement

Both stores require a privacy policy URL. Here's a template you can use:

1. Create a simple website/page with your privacy policy
2. Use a free hosting service (GitHub Pages, Netlify, etc.)
3. Include:
   - What data you collect (email, location)
   - How you use it (authentication, trip planning)
   - Third-party services (Google/Apple Sign-In, Supabase, OpenAI)
   - User rights (delete account, data export)
   - Contact information

Example services for quick privacy policy:
- https://www.privacypolicygenerator.info/
- https://www.freeprivacypolicy.com/
- https://www.termsfeed.com/privacy-policy-generator/

