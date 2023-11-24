import { defineConfig } from "rollup";
import babel from "@rollup/plugin-babel";
// import typescript from '@rollup/plugin-typescript';
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import replace from "@rollup/plugin-replace";
import json from "@rollup/plugin-json";
import serve from "rollup-plugin-serve";
import path from "node:path";

const env = process.env.NODE_ENV || "development";
const debug = env === "development";

// 2.获取文件路径
const packagesDir = path.resolve(__dirname, "packages");
// 2.1 获取需要打包的文件
const packageDir = path.resolve(packagesDir, "./");
// 2.2 获取每个包的配置项
const pkg = require(path.resolve(__dirname, "package.json")); // 获取 json
const packageOptions = pkg.buildOptions || {};
// const name = path.basename(packageDir); // reactivity

// 1、创建一个打包配置
function createConfig(format) {
  console.log("==========");
  console.log(format);
  console.log(packageDir);
  // const packageOptions = pkg.name || {}
  // output.name = packageOptions.name;
  // output.sourcemap = false;
  // 生成rollup配置
  const input = path.resolve(packageDir, `${format}/index.js`);
  console.log(input);
  const config = {
    input, // 输入
    output: {
      // 输出
      file: debug ? `./public/${format}.js` : `./dist/${format}.min.js`,
      format: "cjs",
      sourcemap: debug ? true : false,
    },
    context: "window",
    plugins: [
      // 启动静态服务
      debug &&
        serve({
          port: 3001,
          open: true,
          contentBase: ["public"],
          // contentBase: ["lib/face", "dist"],
          onListening: function (server) {
            console.log("静态服务已启动");
          },
        }),
      json(),
      resolve(),
      babel({
        babelHelpers: "runtime",
        exclude: "node_modules/**",
      }),
      // commonjs({
      //   exclude: "node_modules/onnxruntime-web/**",
      // }),
      commonjs(),
      replace({
        "process.env.NODE_ENV": JSON.stringify(env),
      }),
      !debug &&
        terser({
          format: {
            comments: false,
          },
        }),
    ],
    // plugins: [
    //   json(),
    //   ts({
    //     tsconfig: path.resolve(__dirname, "tsconfig.json"),
    //   }),
    //   resolvePlugin(),
    // ],
  };
  return config;
}

const packageFormats = packageOptions.chunks;

const packageConfigs = packageFormats.map((format) => createConfig(format));

export default defineConfig(packageConfigs);
