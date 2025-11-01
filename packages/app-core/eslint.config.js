import { nextJsConfig } from "@serp-extensions/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
const config = [...nextJsConfig];
const nextPluginConfig = config.find(
  (c) => c.plugins && c.plugins["@next/next"]
);

if (nextPluginConfig && nextPluginConfig.rules) {
  nextPluginConfig.rules["@next/next/no-html-link-for-pages"] = "off";
}

export default config;
