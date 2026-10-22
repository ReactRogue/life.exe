/**
 * Dynamic config layer over app.json.
 *
 * app.json stays the single source of truth for everything (name, version,
 * icons, plugins). This file only exists so CI can serve the static web build
 * from a subpath.
 *
 * GitHub Pages project sites live at https://<owner>.github.io/<repo>/, but
 * Metro emits root-absolute asset URLs (/_expo/...). Without a baseUrl every
 * asset 404s on a project site. The release workflow sets
 * EXPO_WEB_BASE_URL="/<repo>" for the Pages export only.
 *
 * When the variable is unset — local dev, `expo start`, prebuild, Android and
 * iOS builds — the resolved config is byte-for-byte app.json.
 */

const appJson = require('./app.json');

module.exports = ({ config }) => {
  const baseUrl = (process.env.EXPO_WEB_BASE_URL ?? '').trim();
  if (!baseUrl) return config;

  const normalized = `/${baseUrl.replace(/^\/+|\/+$/g, '')}`;
  return {
    ...config,
    experiments: { ...config.experiments, baseUrl: normalized },
  };
};
