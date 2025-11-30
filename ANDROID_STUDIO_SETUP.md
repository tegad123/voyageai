# Android Studio Setup Guide for VoyageAI

## Step 1: Download and Install Android Studio

1. **Download Android Studio**:
   - Go to: https://developer.android.com/studio
   - Click **Download Android Studio**
   - Accept terms and download for macOS (Apple Silicon or Intel based on your Mac)

2. **Install Android Studio**:
   - Open the downloaded `.dmg` file
   - Drag **Android Studio** to **Applications** folder
   - Launch **Android Studio** from Applications
   - If macOS asks for permission, click **Open**

## Step 2: Android Studio Setup Wizard

1. **Welcome Screen**:
   - Click **Next** on the welcome screen
   - Choose **Standard** installation type
   - Select your preferred UI theme (Light/Dark)
   - Click **Next**

2. **Verify Settings**:
   - Review the components that will be installed:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device
     - Performance (Intel® HAXM or Android Emulator hypervisor driver)
   - Note the SDK install location (usually: `/Users/[your-username]/Library/Android/sdk`)
   - Click **Next** > **Finish**

3. **Wait for Downloads** (~5-10 minutes):
   - Android Studio will download SDK components
   - Let it complete

## Step 3: Configure Environment Variables

Once installation completes, set up your PATH:

1. **Open Terminal** (the one we're using now)

2. **Determine your shell**:
   ```bash
   echo $SHELL
   ```
   - If it says `/bin/zsh`: You're using zsh (default on newer macOS)
   - If it says `/bin/bash`: You're using bash

3. **Edit your shell profile**:
   
   For **zsh** (most likely):
   ```bash
   nano ~/.zshrc
   ```
   
   For **bash**:
   ```bash
   nano ~/.bash_profile
   ```

4. **Add these lines at the end** (replace `[your-username]` with your actual username):
   ```bash
   # Android SDK
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

5. **Save and exit**:
   - Press `Ctrl + X`
   - Press `Y` to confirm
   - Press `Enter`

6. **Reload your shell**:
   
   For zsh:
   ```bash
   source ~/.zshrc
   ```
   
   For bash:
   ```bash
   source ~/.bash_profile
   ```

7. **Verify installation**:
   ```bash
   adb --version
   ```
   You should see the ADB version (e.g., "Android Debug Bridge version 1.0.41")

## Step 4: Create Android Virtual Device (AVD)

1. **Open Android Studio** (if not already open)

2. **Open Device Manager**:
   - Click **More Actions** (three dots) on welcome screen
   - Select **Virtual Device Manager**
   - OR: Click **Tools** > **Device Manager** from top menu

3. **Create New Device**:
   - Click **Create Device** (or the **+** button)
   - **Select Hardware**:
     - Category: **Phone**
     - Choose: **Pixel 6** or **Pixel 7** (good for testing)
     - Click **Next**
   
4. **Select System Image**:
   - **Release Name**: Select **UpsideDownCake** (Android 14) or **Tiramisu** (Android 13)
   - **API Level**: 34 (Android 14) or 33 (Android 13)
   - **Target**: Choose one with **Google APIs** or **Google Play** (needed for Google Sign-In)
   - Click **Download** next to the system image (first time only, ~1-2 GB)
   - Wait for download to complete
   - Click **Next**

5. **Configure AVD**:
   - **AVD Name**: `Pixel_6_API_34` (or similar)
   - **Startup orientation**: Portrait
   - **Graphics**: Automatic (or Hardware if your Mac supports it)
   - Click **Show Advanced Settings** (optional):
     - **Camera**: Front/Back: Webcam0 or VirtualScene
     - **RAM**: 2048 MB or higher (if your Mac has enough RAM)
   - Click **Finish**

6. **Your emulator is ready!**
   - You'll see it listed in Device Manager
   - Click the **Play** (▶) button to launch it

## Step 5: Launch the Emulator

**Option A: From Android Studio Device Manager**
- Click the **Play** button next to your emulator
- Wait ~1-2 minutes for it to boot

**Option B: From Terminal**
```bash
emulator -avd Pixel_6_API_34
```
(Replace `Pixel_6_API_34` with your AVD name)

## Step 6: Run VoyageAI on the Emulator

Once the emulator is running:

1. **Verify emulator is connected**:
   ```bash
   adb devices
   ```
   You should see:
   ```
   List of devices attached
   emulator-5554    device
   ```

2. **Navigate to your project** (if not already there):
   ```bash
   cd /Users/tegaumukoro/Desktop/VoyageAI
   ```

3. **Install dependencies** (if you haven't recently):
   ```bash
   npm install
   ```

4. **Run the app on Android**:
   ```bash
   npx expo run:android
   ```
   
   This will:
   - Build the Android version of your app
   - Install Google Sign-In and other native modules
   - Install on the emulator
   - Launch the app
   - First build takes ~5-10 minutes

## Step 7: Testing Google Sign-In on Emulator

For Google Sign-In to work on the emulator:

1. **Ensure emulator has Google Play Services**:
   - When creating AVD, you selected a system image with "Google APIs" or "Google Play"
   - If not, create a new AVD with Google Play

2. **Sign in to Google Account on emulator**:
   - Open emulator
   - Open **Settings** app
   - Go to **Accounts** > **Add account** > **Google**
   - Sign in with your test Google account
   - This is required for Google Sign-In to work

3. **Configure SHA-1 fingerprint**:
   
   Get your debug SHA-1:
   ```bash
   cd ~/.android
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   
   Copy the **SHA-1** fingerprint (looks like: `AA:BB:CC:...`)
   
   Add it to Google Cloud Console:
   - Go to: https://console.cloud.google.com
   - Select your project
   - **APIs & Services** > **Credentials**
   - Find your **Android OAuth client** (or create one):
     - Click **Create credentials** > **OAuth client ID** > **Android**
     - Package name: `com.jmotech.voyageai`
     - SHA-1: Paste the debug SHA-1 from above
     - Click **Create**

## Troubleshooting

### Emulator won't start
- **Check virtualization**: macOS should support it by default
- **Intel Macs**: Install HAXM: `Android Studio > Tools > SDK Manager > SDK Tools > Intel x86 Emulator Accelerator (HAXM)`
- **Apple Silicon (M1/M2/M3)**: Use ARM-based system images (arm64-v8a)

### "adb: command not found" after setup
- Make sure you saved the PATH variables in the correct file (`.zshrc` or `.bash_profile`)
- Close and reopen Terminal
- Run `source ~/.zshrc` again

### App crashes on launch
- Check logs: `npx react-native log-android`
- Or: `adb logcat | grep -i "VoyageAI"`

### "Unable to locate ADB"
```bash
echo $ANDROID_HOME
```
Should show: `/Users/[your-username]/Library/Android/sdk`

If empty, re-add the export lines to your shell profile.

### Build fails with "SDK location not found"
Create a file `android/local.properties`:
```
sdk.dir=/Users/[your-username]/Library/Android/sdk
```

### Google Sign-In shows "DEVELOPER_ERROR"
- SHA-1 not added to Google Cloud Console
- Package name mismatch
- Not signed in to Google account on emulator

### App builds but doesn't install
```bash
adb uninstall com.jmotech.voyageai
npx expo run:android
```

## Quick Reference Commands

```bash
# List connected devices/emulators
adb devices

# Launch specific emulator
emulator -avd Pixel_6_API_34

# Run app on Android
npx expo run:android

# View logs
npx react-native log-android

# Uninstall app
adb uninstall com.jmotech.voyageai

# Clear app data
adb shell pm clear com.jmotech.voyageai

# Restart ADB server
adb kill-server
adb start-server
```

## Next Steps

Once the emulator is running and VoyageAI is installed:

1. Test all major features:
   - [ ] Google Sign-In
   - [ ] Apple Sign-In (won't work on Android, that's expected)
   - [ ] Chat functionality
   - [ ] Itinerary creation
   - [ ] Image loading
   - [ ] Location-based recommendations
   - [ ] Saving trips

2. If everything works on emulator, proceed to build for Play Store:
   ```bash
   eas build --platform android --profile production
   ```

Good luck! 🚀

