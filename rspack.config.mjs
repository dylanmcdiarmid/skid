import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@rspack/cli";
import { NotifyDevServerPlugin } from "./scripts/rspack-notify-plugin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const envSuffix = isProd ? "prod" : "dev";

export default defineConfig({
  mode: isProd ? "production" : "development",
  entry: {
    bundle: "./client/src/main.tsx",
  },
  output: {
    path: path.resolve(__dirname, `public/js/${envSuffix}`),
    filename: "[name].js",
    chunkFilename: "[name].js",
    publicPath: `/js/${envSuffix}/`,
    clean: true,
  },
  devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
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
                  development: !isProd,
                },
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        type: "css",
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
        type: "asset",
      },
    ],
  },
  optimization: {
    minimize: isProd,
  },
  watchOptions: {
    ignored: /node_modules/,
  },
  stats: {
    preset: "errors-warnings",
    timings: true,
  },
  plugins: [...(isProd ? [] : [new NotifyDevServerPlugin()])],
});
