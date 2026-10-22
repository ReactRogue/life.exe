#!/usr/bin/env node
/**
 * Bump the version in app.json — the single place release numbers live.
 *
 *   node scripts/bump-version.mjs            # 1.0.0 -> 1.0.1 (patch)
 *   node scripts/bump-version.mjs minor      # 1.0.0 -> 1.1.0
 *   node scripts/bump-version.mjs major      # 1.0.0 -> 2.0.0
 *   node scripts/bump-version.mjs 2.3.4      # explicit
 *
 * Also increments android.versionCode and ios.buildNumber so the native
 * builds always move forward — app stores reject a repeated build number even
 * when the marketing version changed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appJsonPath = join(here, '..', 'app.json');

const raw = readFileSync(appJsonPath, 'utf8');
const appJson = JSON.parse(raw);
const expo = appJson.expo;

const current = String(expo.version ?? '1.0.0');
const match = /^(\d+)\.(\d+)\.(\d+)/.exec(current);
if (!match) {
  console.error(`[bump] expo.version "${current}" is not semver-like.`);
  process.exit(1);
}

const [, majorRaw, minorRaw, patchRaw] = match;
let major = Number(majorRaw);
let minor = Number(minorRaw);
let patch = Number(patchRaw);

const arg = (process.argv[2] ?? 'patch').trim();

if (arg === 'major') {
  major += 1;
  minor = 0;
  patch = 0;
} else if (arg === 'minor') {
  minor += 1;
  patch = 0;
} else if (arg === 'patch') {
  patch += 1;
} else if (/^\d+\.\d+\.\d+$/.test(arg)) {
  [major, minor, patch] = arg.split('.').map(Number);
} else {
  console.error(`[bump] Unknown argument "${arg}". Use patch | minor | major | x.y.z`);
  process.exit(1);
}

const next = `${major}.${minor}.${patch}`;

const prevCode = Number(expo.android?.versionCode ?? 0);
const prevBuild = Number(expo.ios?.buildNumber ?? 0);

expo.version = next;
expo.android = { ...(expo.android ?? {}), versionCode: prevCode + 1 };
expo.ios = { ...(expo.ios ?? {}), buildNumber: String(prevBuild + 1) };

writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`, 'utf8');

console.log(`[bump] version     ${current} -> ${next}`);
console.log(`[bump] versionCode ${prevCode} -> ${expo.android.versionCode}`);
console.log(`[bump] buildNumber ${prevBuild} -> ${expo.ios.buildNumber}`);
console.log('\nNext: git commit -am "Release v' + next + '" && git push');
