# life.exe

Turn Life into a Game

A local-first life RPG built with Expo SDK 58, React Native, TypeScript, Expo Router and NativeWind.

## Development

```bash
npm install
npm start          # Expo dev server
npm run web        # web preview
npm run typecheck  # tsc --noEmit
npm test           # 36 domain tests (XP, streaks, dates, achievements)
```

## Releases

`app.json` is the single source of truth for versioning:

| Field | Drives |
| --- | --- |
| `expo.version` | Release tag (`v1.2.3`), artifact file names |
| `expo.android.versionCode` | `versionCode` in the APK |
| `expo.ios.buildNumber` | `CFBundleVersion` in the IPA |

### Cutting a release

```bash
npm run release:bump -- patch   # 1.0.0 -> 1.0.1, also bumps both build numbers
git commit -am "Release v1.0.1"
git push origin main
```

That push runs `.github/workflows/release.yml`, which:

1. resolves the version from `app.json` (`npm run release:info` shows what it will use),
2. runs `tsc --noEmit` and the domain tests,
3. builds a **release APK** on Ubuntu (signed with Expo's generated debug keystore),
4. builds a **release IPA** on macOS with code signing disabled, then zips it as `Payload/`,
5. exports the **static web build**,
6. publishes a GitHub Release at tag `v<version>` with the APK, IPA, web zip and `SHA256SUMS.txt`.

The tag is created on the exact commit that produced the binaries, and re-running the
workflow for the same version refreshes the assets on the existing release.

### Artifacts

| File | Notes |
| --- | --- |
| `life-exe-<version>-android.apk` | Installs directly. Signed with the debug key (`CN=Android Debug`). |
| `life-exe-<version>-ios-unsigned.ipa` | Not code signed. Install via AltStore/Sideloadly or sign it yourself. |
| `life-exe-<version>-web.zip` | Static bundle; unzip and serve over HTTP. |

An unsigned IPA cannot be installed by iOS on its own — that is an Apple signing
requirement, not a pipeline limitation. App Store / TestFlight distribution needs
an Apple Developer certificate and provisioning profile (or EAS Build).

### Signing the APK with your own keystore

By default the release APK uses the debug keystore so it installs anywhere. To ship a
properly signed build, add these repository secrets and the workflow switches over
automatically:

- `ANDROID_KEYSTORE_BASE64` — base64 of your `.keystore`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

### Running the pipeline manually

Actions → **Release** → *Run workflow*. The `publish` input controls whether a GitHub
Release is created; leave it off to just build and download the artifacts from the run.
