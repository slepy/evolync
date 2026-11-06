/**
 * Fingerprint (runtimeVersion policy) inputs. google-services.json comes from
 * the GOOGLE_SERVICES_JSON EAS file variable on builds and may be missing
 * where `eas update` runs; hashing it would give the update a different
 * runtime version than the build, and Android would never receive it.
 * @type {import('expo/fingerprint').Config}
 */
module.exports = {
  // On EAS the variable resolves to ../eas-environment-secrets/<hash>, not to
  // a file named google-services.json, so that path is ignored too.
  ignorePaths: ["**/google-services.json", "../eas-environment-secrets/**"],
};
