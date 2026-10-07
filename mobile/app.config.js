// Extends app.json. For the website build hosted under a sub-path
// (GitHub Pages: https://sey4192.github.io/ExAiSemProj/), set
// EXPO_BASE_URL=/ExAiSemProj when exporting. Development and the Android
// build leave it unset.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
