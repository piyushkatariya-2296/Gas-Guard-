# GasGuard Store Deployment & Installation Guide

This guide details how to publish and install GasGuard across **Android (Google Play Store)**, **Windows Desktop**, and **iOS (Apple App Store)**.

---

## 1. 🤖 Android: Google Play Store Publishing

GasGuard is configured as a native Android project inside `mobile/android/`.

### Method A: Build via Android Studio (Local PC)
1. Download & install **Android Studio** (from [developer.android.com/studio](https://developer.android.com/studio)).
2. Open Android Studio → **File → Open** → select folder:
   ```
   c:\Users\PIYUSH\OneDrive\Scans\GAS DETECTOR\mobile\android
   ```
3. Android Studio will automatically sync the Gradle files and download the Android SDK.
4. **Generate Release Bundle (.aab)**:
   - Click **Build → Generate Signed Bundle / APK...**
   - Select **Android App Bundle (.aab)** → click Next.
   - Click **Create new...** to create your signing key (`.jks` keystore file) or choose an existing key.
   - Select **release** build variant and click **Finish**.
5. The generated file will be located at:
   ```
   mobile/android/app/build/outputs/bundle/release/app-release.aab
   ```
6. **Upload to Google Play Console**:
   - Go to [play.google.com/console](https://play.google.com/console).
   - Create a new App → Name: **GasGuard**.
   - Navigate to **Production → Create new release**.
   - Upload the `app-release.aab` file.
   - Complete the Store Listing (Description, screenshots, safety category) and click **Start rollout to Production**.

### Method B: Automated Cloud Build via GitHub Actions (Zero Local SDK needed)
We have configured `.github/workflows/build-android-ios.yml`.
1. Push your project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial GasGuard multi-platform release"
   git remote add origin https://github.com/<your-username>/gasguard.git
   git push -u origin main
   ```
2. Navigate to the **Actions** tab on your GitHub repository.
3. The **"Build GasGuard Android & iOS Mobile Apps"** workflow will compile the project in the cloud.
4. Once completed, download the **`gasguard-playstore-bundle-aab`** and **`gasguard-android-apk`** directly from the GitHub Actions Artifacts section!

---

## 2. 🪟 Windows: Desktop App Installation & Microsoft Store

GasGuard supports two official Windows installation methods:

### Method A: Instant 1-Click Native Desktop Installation
GasGuard is fully configured with PWA `manifest.json` and `sw.js` (Service Worker).
1. Open [http://localhost:3000](http://localhost:3000) in **Microsoft Edge** or **Google Chrome**.
2. Look at the right side of the URL address bar:
   - Click the **"App Available. Install GasGuard"** button (icon with a plus sign `⊕` or screen icon).
   - Or open the in-app **Settings** tab and click **"1-Tap Install App on this Device"**.
3. GasGuard will immediately install directly into your Windows operating system:
   - Created shortcut in **Windows Start Menu**.
   - Pinned to the **Windows Taskbar**.
   - Runs in a clean standalone desktop window without browser URL bars or tabs.

### Method B: Microsoft Store Package (.msix) via PWABuilder
1. Go to [pwabuilder.com](https://www.pwabuilder.com) (Microsoft's official open-source tool).
2. Enter your deployed GasGuard web URL.
3. Click **Package for Stores → Windows**.
4. PWABuilder will automatically generate a signed `.msix` / `.appx` bundle ready for submission to the **Microsoft Partner Center** / **Microsoft Store**.

---

## 3. 🍏 iOS: Apple App Store Publishing

The native iOS Xcode project is located in `mobile/ios/`.

### Method A: TestFlight & App Store submission via Xcode
1. Open the project on a Mac:
   ```bash
   open mobile/ios/App/App.xcworkspace
   ```
2. In Xcode, select **App** in the project navigator:
   - Under **Signing & Capabilities**, select your **Apple Developer Team**.
   - Bundle Identifier is pre-configured as: `com.gasguard.iot`.
3. Select **Any iOS Device (arm64)** as the build target.
4. Click **Product → Archive**.
5. Once the archive completes in the Organizer window, click **Distribute App → App Store Connect → Upload**.
6. Open [appstoreconnect.apple.com](https://appstoreconnect.apple.com) to manage TestFlight beta testers and submit for App Store Review.

### Method B: Instant Fullscreen iOS WebApp (No Mac or App Store review needed)
1. Open the GasGuard URL in **Safari** on an iPhone or iPad.
2. Tap the **Share** button (box with an upward arrow `⎋`) at the bottom.
3. Scroll down and tap **"Add to Home Screen" (⊞)**.
4. Tap **Add**.
5. GasGuard will appear on your iOS home screen as a native app with full-screen experience and hardware-accelerated transitions.

---

## 4. Hardware Permissions Included

The following permissions are already configured in `mobile/android/app/src/main/AndroidManifest.xml`:
- `android.permission.INTERNET`: For 24/7 cloud MQTT telemetry & alerts across cellular/Wi-Fi.
- `android.permission.ACCESS_NETWORK_STATE`: For checking connectivity transitions.
- `android.permission.BLUETOOTH` & `BLUETOOTH_ADMIN`: Legacy BLE communication.
- `android.permission.BLUETOOTH_SCAN`: Android 12+ BLE discovery for "LPG SHIELD".
- `android.permission.BLUETOOTH_CONNECT`: Android 12+ BLE pairing & characteristic reading.
- `android.permission.ACCESS_FINE_LOCATION`: Required by Android OS for Bluetooth beacon discovery.
