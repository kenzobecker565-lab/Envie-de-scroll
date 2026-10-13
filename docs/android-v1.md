# Scroll-up V1 Android

Native Android shell (Android 8+) restricted to the production V1 HTTPS origin.
The application loads `?android=1`, generating a private 256-bit installation key in DOM storage. The server derives a negative installation ID with HMAC using its existing stable signing secret. Telegram identities remain positive and retain their existing access. No dev authentication is enabled in production.

Progress is stored on the V1 server and retrieved using this installation key. Internet is required. Uninstalling, clearing application data or changing phone loses access; there is no account recovery. Android backup is disabled to prevent identity duplication. Telegram reminders are not offered in the APK.

The GitHub `APK V1 Android` workflow builds a non-debuggable unsigned release and checks Android lint. Download its artifact, then sign locally using the private V1 keystore with apksigner. Never commit or upload signing keys to GitHub. Keep the same package ID and signing key for updates and increment versionCode.

Build: Java 17, Gradle 8.11.1, Android Gradle plugin 8.9.2, SDK 35.

Device checks before broad distribution: install; onboarding; reopen and retained progress; writing and drawing/photo selection; piano audio; shop code; back button; airplane mode/retry; permission-free launch. No native notifications, offline mode or automatic update installer in this test build.
