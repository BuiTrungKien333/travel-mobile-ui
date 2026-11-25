const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// The demo laptop also runs PostgreSQL, Spring and Android tooling. Avoid a
// separate transformer for every CPU while producing its standalone bundles.
if (process.env.EXPO_PUBLIC_LAN_DEMO === "true") {
  config.maxWorkers = Math.min(config.maxWorkers, 2);
}

module.exports = config;
