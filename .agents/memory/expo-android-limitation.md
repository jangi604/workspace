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

Since you can still prepare the project for that external build, a bare `"android": {}`
block is a sign it was never configured: add `package` (reverse-domain id), `versionCode`,
`adaptiveIcon` (foregroundImage + backgroundColor — reuse the existing square icon as
foreground and match backgroundColor to its own bg color so mask-cropping is invisible
when no dedicated transparent icon asset exists), and an explicit `permissions` array.
Also add a config-plugin entry (with permission-description strings) for any native
module that needs one (e.g. `expo-image-picker` for camera/photos), and create `eas.json`
with development/preview(apk)/production(app-bundle) build profiles if missing. Cross-check
installed `expo-*` packages against actual code usage — unused ones (e.g. a leftover
`expo-location` from scaffolding) should be removed before a build to avoid needless
permission prompts/store scrutiny.
