# Implementation Plan - Publish v0.0.16 Release

This plan outlines the steps to update the versioning, build the project, and publish a new GitHub release `v0.0.16`.

## User Review Required

> [!IMPORTANT]
> This process will commit all currently unstaged and staged changes with the message "Release v0.0.16".
> It will also push the current `main` branch to the remote repository.

## Proposed Changes

### Versioning Updates

#### [MODIFY] [package.json](file:///C:/repositories/vitatrack/package.json)
- Update `version` to `0.0.16`.

#### [MODIFY] [build.gradle](file:///C:/repositories/vitatrack/android/app/build.gradle)
- Update `versionCode` to `16`.
- Update `versionName` to `"0.0.16"`.

### Build & Release Workflow

1. **Commit Changes**:
   - `git add .`
   - `git commit -m "Release v0.0.16"`
   - `git tag v0.0.16`

2. **Build Web Assets**:
   - `npm run build`

3. **Sync Capacitor**:
   - `npx cap sync android`

4. **Build Android APK**:
   - `cd android && ./gradlew assembleRelease`
   - Copy the generated APK from `android/app/build/outputs/apk/release/app-release.apk` to the root as `vitatrack-v0.0.16.apk`.

5. **Publish to GitHub**:
   - `git push origin main --tags`
   - `gh release create v0.0.16 vitatrack-v0.0.16.apk --title "v0.0.16" --notes "Release v0.0.16"`

## Verification Plan

### Automated Steps
- Verify `package.json` and `build.gradle` reflect the new version.
- Verify `vitatrack-v0.0.16.apk` exists after the build.
- Verify the GitHub release is visible on the repository.
