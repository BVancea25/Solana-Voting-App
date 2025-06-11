const webpack = require("webpack");

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    assert: require.resolve("assert"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    os: require.resolve("os-browserify/browser"),
    util: require.resolve("util"),
    buffer: require.resolve("buffer"),
    process: require.resolve("process/browser"),
  });
  config.resolve.fallback = fallback;

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]);

  // support .mjs packages
  config.module.rules.push({
    test: /\.m?js/,
    resolve: { fullySpecified: false },
  });

  const oneOf = config.module.rules.find((r) => Array.isArray(r.oneOf)).oneOf;

  oneOf.forEach((rule) => {
    // Target the CSS rules (both regular CSS and CSS Modules)
    if (
      rule.test &&
      rule.test.toString().includes("css") &&
      Array.isArray(rule.use)
    ) {
      rule.use.forEach((loader) => {
        if (
          loader.loader &&
          loader.loader.includes("postcss-loader")
        ) {
          // Override postcssOptions to use the Tailwind v4 plugin
          loader.options.postcssOptions = {
            plugins: [
              require("@tailwindcss/postcss"),
              require("autoprefixer"),
            ],
          };
        }
      });
    }
  });

  return config;
};