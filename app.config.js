const fs = require("fs");
const path = require("path");

/**
 * Extends app.json. Android push needs FCM credentials in the build: EAS
 * provides them through the GOOGLE_SERVICES_JSON file variable, local builds
 * read ./google-services.json. Without either, the build still works but
 * Android devices receive no push (see supabase/functions/send-push/README.md).
 */
module.exports = ({ config }) => {
  const localFile = path.join(__dirname, "google-services.json");
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ?? (fs.existsSync(localFile) ? "./google-services.json" : undefined);

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
  };
};
