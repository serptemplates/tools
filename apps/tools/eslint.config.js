import { nextJsConfig } from "@serp-tools/eslint-config/next-js";

const turboEnvAllowList = [
  "^YTDLP_BINARY_URL$",
  "^YOUTUBE_DL_HOST$",
  "^GITHUB_TOKEN$",
  "^GH_TOKEN$",
  "^ADSENSE_PUBLISHER_ID$",
];

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    rules: {
      "turbo/no-undeclared-env-vars": ["warn", { allowList: turboEnvAllowList }],
    },
  },
];
