---
name: Expo/Replit Android build limitation
description: Replit cannot produce an Android APK/AAB for Expo mobile artifacts in-workspace.
---

Replit's Expo Launch integration only supports **iOS** App Store publishing. There is
no Android APK/AAB build available in the workspace, and EAS CLI usage is not
permitted for building here.

**Why:** Platform limitation of the Expo Launch feature as currently offered.

**How to apply:** When a user wants a downloadable/installable Android build, tell
them upfront (don't discover this late): they need to run `eas build -p android`
themselves outside Replit using their own Expo/EAS account (free tier available),
using the project's existing `app.json`/`app.config` as-is, or use `expo export` +
a local Gradle build. Offer this as the concrete next step rather than just stating
the limitation.
