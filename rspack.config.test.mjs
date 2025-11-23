import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@rspack/cli";
import rspack from "@rspack/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  mode: "none",
  entry: {
    bundle: "./client/tests/runner.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist-tests"),
    filename: "[name].js",
    publicPath: "/",
    clean: true,
  },
  devtool: "source-map",
  externals: {
    qunit: "QUnit",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@gen": path.resolve(__dirname, "./client/src/gen"),
      "@tests": path.resolve(__dirname, "./client/tests"),
      "@lib": path.resolve(__dirname, "./client/src/lib"),
      "@state": path.resolve(__dirname, "./client/src/state"),
      "@hooks": path.resolve(__dirname, "./client/src/hooks"),
      "@components": path.resolve(__dirname, "./client/src/components"),
      "@pages": path.resolve(__dirname, "./client/src/pages"),
      "@/types": path.resolve(__dirname, "./client/src/types"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                  development: true,
                },
              },
            },
          },
        },
      },
    ],
  },
  plugins: [
    new rspack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("test"),
      "process.env.TEST_FILTER": JSON.stringify(process.env.TEST_FILTER || ""),
    }),
    new rspack.CopyRspackPlugin({
      patterns: [
        {
          from: "client/src/test_assets/qunit.js",
          to: "qunit.js",
        },
        {
          from: "client/src/test_assets/qunit.css",
          to: "qunit.css",
        },
      ],
    }),
    {
      name: "generate-test-html",
      apply(compiler) {
        compiler.hooks.afterEmit.tap("generate-test-html", () => {
          const testHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QUnit Test Runner</title>
    <link rel="stylesheet" href="qunit.css">
  </head>
  <body>
    <div id="qunit"></div>
    <div id="qunit-fixture"></div>
    <script src="qunit.js"></script>
    <script>
      QUnit.config.autostart = false;
    </script>
    <script src="bundle.js"></script>
  </body>
</html>`;
          writeFileSync(
            path.resolve(__dirname, "dist-tests/test.html"),
            testHtml
          );
        });
      },
    },
  ],
  devServer: {
    port: 4000,
    open: ["/test.html"],
    static: {
      directory: path.resolve(__dirname, "dist-tests"),
    },
  },
});
