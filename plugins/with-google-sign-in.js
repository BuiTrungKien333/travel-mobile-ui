const { withAppDelegate } = require("expo/config-plugins");

/** @type {import('expo/config-plugins').ConfigPlugin} */
module.exports = (config) => withAppDelegate(config, (config) => {
  if (config.modResults.language !== "swift") {
    throw new Error("Google Sign-In requires the Expo SDK 57 Swift AppDelegate.");
  }
  let contents = config.modResults.contents;
  if (contents.includes("// Tripzy Google Sign-In callback")) return config;

  // SDK 57 ExpoAppSceneDelegate forwards warm/cold scene URLs to this override.
  // Preserve the Expo delegate so Router, dev-client and other links still work.
  const anchor = /^(\s*)return super\.application\(app, open: url, options: options\)/m;
  if (!anchor.test(contents)) {
    throw new Error("Cannot find Expo AppDelegate URL handler; review the Google callback plugin before building.");
  }
  contents = `import GoogleSignIn\n${contents}`;
  contents = contents.replace(anchor, "$1// Tripzy Google Sign-In callback\n$1if GIDSignIn.sharedInstance.handle(url) { return true }\n$1return super.application(app, open: url, options: options)");
  config.modResults.contents = contents;
  return config;
});
