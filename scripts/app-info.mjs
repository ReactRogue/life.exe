#!/usr/bin/env node
/**
 * Single source of truth for release metadata.
 *
 * Reads `app.json` and derives the version, release tag, native build numbers,
 * and artifact base name. Everything the release workflow needs comes from
 * here so there is exactly one place to bump a version.
 *
 *   node scripts/app-info.mjs            # human readable
 *   node scripts/app-info.mjs --json     # machine readable
 *
 * When running inside GitHub Actions, each field is also appended to
 * $GITHUB_OUTPUT so later steps can reference `steps.meta.outputs.*`.
 */

import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function fail(message) {
  console.error(`\n[app-info] ${message}\n`);
  process.exit(1);
}

let appJson;
try {
  appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
} catch (error) {
  fail(`Could not read app.json: ${error.message}`);
}

const expo = appJson.expo;
if (!expo || typeof expo !== 'object') fail('app.json is missing the "expo" object.');

const version = String(expo.version ?? '').trim();
if (!/^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$/.test(version)) {
  fail(`expo.version must look like 1.2.3 (found "${version || 'nothing'}").`);
}

const slug = String(expo.slug ?? 'app').trim() || 'app';
const name = String(expo.name ?? slug).trim() || slug;
const tag = `v${version}`;

// Native build numbers are optional in app.json; fall back to 1 so a fresh
// project still produces valid store metadata.
const iosBuildNumber = String(expo.ios?.buildNumber ?? '1').trim() || '1';
const androidVersionCode = Number(expo.android?.versionCode ?? 1);

if (!Number.isInteger(androidVersionCode) || androidVersionCode < 1) {
  fail(`expo.android.versionCode must be a positive integer (found "${expo.android?.versionCode}").`);
}

const info = {
  name,
  slug,
  version,
  tag,
  artifactBase: `${slug}-${version}`,
  androidVersionCode,
  iosBuildNumber,
  androidPackage: expo.android?.package ?? '',
  iosBundleId: expo.ios?.bundleIdentifier ?? '',
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(info, null, 2));
} else {
  console.log('Life.exe release metadata');
  console.log('-------------------------');
  for (const [key, value] of Object.entries(info)) {
    console.log(`  ${key.padEnd(20)} ${value}`);
  }
}

if (process.env.GITHUB_OUTPUT) {
  const lines = Object.entries(info)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  appendFileSync(process.env.GITHUB_OUTPUT, `${lines}\n`, 'utf8');
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = Object.entries(info)
    .map(([key, value]) => `| ${key} | \`${value}\` |`)
    .join('\n');
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Release metadata (from app.json)\n\n| field | value |\n| --- | --- |\n${rows}\n\n`,
    'utf8',
  );
}
