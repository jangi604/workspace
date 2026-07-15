mkdir -p .github/workflows
cat << 'EOF' > .github/workflows/build.yml
name: Build Android APK
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest

      - name: Install dependencies
        run: |
          cd artifacts/mobile
          pnpm install --no-frozen-lockfile

      - name: Build APK locally via EAS
        run: |
          cd artifacts/mobile
          npx expo export
          pnpm exec eas build --platform android --local --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Upload APK Artifact
        uses: actions/artifacts@v4
        with:
          name: jangi-fiber-apk
          path: artifacts/mobile/*.apk
EOF