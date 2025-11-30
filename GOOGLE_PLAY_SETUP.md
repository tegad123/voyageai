# Google Play Store Setup Guide

## Prerequisites

Before building for Google Play, you need:

### 1. Google Play Console Account
- Go to https://play.google.com/console
- Sign up with your Google account (one-time $25 fee)
- Complete the developer profile

### 2. Google Services Configuration (Optional, for Analytics/Crashlytics)

If you want Google services:
1. Go to https://console.firebase.google.com
2. Add Android app with package: `com.jmotech.voyageai`
3. Download `google-services.json`
4. Place it in your project root

**Note**: If you don't need Firebase, you can skip this and remove the `googleServicesFile` line from `app.config.js`.

### 3. Google Sign-In for Android

Your Google Sign-In is already configured for iOS. For Android:
1. Go to https://console.cloud.google.com
2. Navigate to your project (or create one)
3. Go to **APIs & Services** > **Credentials**
4. Create **OAuth 2.0 Client ID** for **Android**:
   - Application type: **Android**
   - Package name: `com.jmotech.voyageai`
   - SHA-1 certificate fingerprint: Get this from EAS (see step below)
5. Also ensure you have a **Web application** client for Supabase (already done)

#### Get SHA-1 Certificate Fingerprint from EAS:

```bash
eas credentials
```
- Select: Android > Production
- Choose: "Show credentials" or "Keystore"
- Copy the SHA-1 fingerprint

Or build first and EAS will generate it:
```bash
eas build --platform android --profile production
```

Then run `eas credentials` to get the SHA-1.

---

## Building for Google Play

### Step 1: Build the Android App Bundle (AAB)

```bash
eas build --platform android --profile production
```

This will:
- Build an optimized AAB file for Google Play
- Use your configured package name: `com.jmotech.voyageai`
- Auto-generate a keystore (if first build)
- Take ~10-15 minutes

### Step 2: Download the AAB

Once the build completes:
1. EAS will show a download link
2. Download the `.aab` file to your computer
3. Or get it from: https://expo.dev/accounts/[your-account]/projects/voyageai/builds

---

## Uploading to Google Play Console

### Initial Setup (First Time Only)

1. **Create App in Google Play Console**
   - Go to https://play.google.com/console
   - Click **Create app**
   - Fill in:
     - App name: **VoyageAI**
     - Default language: **English (United States)**
     - App or game: **App**
     - Free or paid: **Free** (or paid if you plan to charge)
   - Accept declarations and click **Create app**

2. **Complete Store Listing**
   - Go to **Store presence** > **Main store listing**
   - Add:
     - Short description (80 chars)
     - Full description (4000 chars)
     - App icon (512x512 PNG)
     - Feature graphic (1024x500 PNG)
     - Screenshots (at least 2, 16:9 or 9:16 ratio)
     - App category: **Travel & Local**
     - Contact email: Your email
     - Privacy policy URL (if you have one)

3. **Set Up Content Rating**
   - Go to **Policy** > **App content** > **Content rating**
   - Fill out questionnaire (travel app, no violence/adult content)
   - Submit for rating

4. **Set Up Target Audience**
   - Go to **Policy** > **App content** > **Target audience and content**
   - Select age groups: Likely **18+** (or as appropriate)

5. **Complete Privacy & Security**
   - **Data safety**: Declare what data you collect
   - **Government apps**: Select No (unless applicable)
   - **Financial features**: Select No (unless you have payment features)
   - **Health & fitness**: Select No
   - **COVID-19 contact tracing**: Select No

### Upload the AAB

1. Go to **Release** > **Testing** > **Internal testing** (recommended for first test)
2. Click **Create new release**
3. Upload your `.aab` file
4. Add release notes (e.g., "First internal test build")
5. Click **Review release** > **Start rollout to Internal testing**
6. Add testers:
   - Go to **Testers** tab
   - Create email list with your test accounts
   - Save

7. **Get Test Link**
   - Once release is live (~few minutes), get the opt-in URL
   - Share with testers or test yourself
   - Testers opt-in, then download from Play Store

---

## Testing the Build

### Internal Testing Track
- For you and small team (up to 100 testers)
- Fast review (~minutes to hours)
- Not visible to public

### Closed Testing Track
- For larger beta group
- Requires more review
- Can create via feedback forms

### Open Testing Track  
- Public beta, anyone can join
- Longer review process

---

## Moving to Production

Once you've tested and are ready to launch:

1. Go to **Release** > **Production**
2. Click **Create new release**
3. Upload same AAB or rebuild with any fixes
4. Add release notes
5. Set rollout percentage (start with 10-20%)
6. Submit for review

**First production review takes 3-7 days**. Subsequent updates are usually faster.

---

## Automated Submission with EAS (Optional)

After you have:
1. Created app in Play Console
2. Completed store listing
3. Done at least one manual upload

You can automate future uploads:

### 1. Create Service Account

1. Go to https://console.cloud.google.com
2. Select your project
3. **IAM & Admin** > **Service Accounts** > **Create Service Account**
   - Name: `eas-voyageai-publisher`
   - Click **Create and Continue**
4. Grant role: **Service Account User**
5. Click **Done**
6. Click on the service account
7. **Keys** tab > **Add Key** > **Create new key** > **JSON**
8. Download the JSON file
9. Rename to `google-play-service-account.json`
10. Place in your project root

### 2. Link to Play Console

1. Go to Play Console > **Users and permissions** > **Invite new users**
2. Click **Service accounts** tab
3. Click **Grant access** on your service account
4. Assign permissions:
   - **Admin (all permissions)** or
   - **Release to testing tracks** + **View app information**
5. Click **Invite user**

### 3. Auto-Submit with EAS

```bash
eas build --platform android --profile production --auto-submit
```

Or submit after build:
```bash
eas submit --platform android --latest
```

This will upload to the `internal` track (as configured in `eas.json`).

---

## Quick Reference Commands

```bash
# Build for Android
eas build --platform android --profile production

# Build and auto-submit (after service account setup)
eas build --platform android --profile production --auto-submit

# Submit latest build
eas submit --platform android --latest

# Check credentials
eas credentials

# Build preview (for testing on device before Play Store)
eas build --platform android --profile preview
```

---

## Checklist Before First Build

- [ ] Updated `app.config.js` with proper Android package name
- [ ] Have or willing to skip `google-services.json` (remove line from config if skipping)
- [ ] Google Play Console account created ($25 paid)
- [ ] Store listing content prepared (descriptions, images, screenshots)
- [ ] Privacy policy URL (if collecting user data)
- [ ] Tested app thoroughly on local Android emulator/device

---

## Troubleshooting

### Build Fails - "Duplicate resources"
- Likely icon/splash issue
- Ensure `Resizedlogo.png` exists in `assets/images/`

### Build Fails - "google-services.json not found"
- Either add the file OR remove `googleServicesFile` line from `app.config.js`

### Google Sign-In doesn't work after installing
- Ensure SHA-1 from EAS keystore is added to Google Cloud Console OAuth client
- Run `eas credentials` to get SHA-1
- Add to your Android OAuth client in Google Cloud Console

### Upload rejected - "Version code already exists"
- Increment `versionCode` in `app.config.js` (currently 4)
- Also increment `version` string (currently "1.0.4")

### App crashes on launch
- Check logs: `adb logcat` or Sentry dashboard
- Common issues: API keys not loaded, missing permissions

---

## Notes

- **Package Name**: `com.jmotech.voyageai` (cannot be changed after first upload)
- **Version Code**: Currently `4` - increment for each Play Store release
- **Version String**: Currently `1.0.4` - user-facing version

Good luck! 🚀

