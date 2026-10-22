#!/usr/bin/env node
/**
 * Optionally upgrade the Android release build from the debug keystore to a
 * real upload keystore.
 *
 * Expo's generated `android/app/build.gradle` ships with
 * `release { signingConfig signingConfigs.debug }`. That is what makes the
 * out-of-the-box "release APK signed with the debug key" work, and it is the
 * default path here.
 *
 * If the repository has an `ANDROID_KEYSTORE_BASE64` secret, the release job
 * decodes it to a file and calls this script, which injects a `release`
 * signing config that reads from environment variables. Without that secret
 * the script is a no-op, so the default build can never be broken by it.
 *
 *   node scripts/patch-android-signing.mjs
 *
 * The generated Gradle config reads these environment variables at build
 * time, so they must be present when Gradle runs:
 *   ANDROID_KEYSTORE_PATH      absolute path to the decoded .keystore
 *   ANDROID_KEYSTORE_PASSWORD  store password
 *   ANDROID_KEY_ALIAS          key alias
 *   ANDROID_KEY_PASSWORD       key password
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gradleFile = join(here, '..', 'android', 'app', 'build.gradle');

// Gate on the secret itself rather than on files/env that are only populated
// in later workflow steps. When the secret is absent this is a no-op.
const keystoreSecret = process.env.ANDROID_KEYSTORE_BASE64;

function skip(reason) {
  console.log(`[android-signing] skipped: ${reason}`);
  process.exit(0);
}

if (!keystoreSecret) {
  console.log('[android-signing] ANDROID_KEYSTORE_BASE64 is not set.');
  console.log('[android-signing] the release APK will use the generated debug keystore.');
  process.exit(0);
}
if (!existsSync(gradleFile)) skip('android/app/build.gradle does not exist (run expo prebuild first)');

let gradle = readFileSync(gradleFile, 'utf8');
if (gradle.includes('releaseKeystore')) skip('release signing config is already present');

const marker = 'signingConfigs {';
const markerIndex = gradle.indexOf(marker);
if (markerIndex === -1) skip('could not locate the signingConfigs block');

const releaseConfig = `
        releaseKeystore {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }`;

gradle = gradle.slice(0, markerIndex + marker.length) + releaseConfig + gradle.slice(markerIndex + marker.length);

// Point the release build type at the new config.
const releasePattern = /(release\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug/;
if (!releasePattern.test(gradle)) skip('could not find the release signingConfig reference');
gradle = gradle.replace(releasePattern, '$1signingConfigs.releaseKeystore');

writeFileSync(gradleFile, gradle, 'utf8');
console.log('[android-signing] release build will be signed with the provided upload keystore.');
