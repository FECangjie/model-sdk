import babel from "@rollup/plugin-babel";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import replace from "@rollup/plugin-replace";
import json from "@rollup/plugin-json";
import serve from "rollup-plugin-serve";

const env = process.env.NODE_ENV || "development";
const debug = env === "development";
const format = "article";

export default {
  input: "./packages/article/index.ts",
  // input: './public/ttsa.min-1.3.2.js',
  context: "window",
  output: {
    file: debug ? `./public/${format}.js` : `./public/${format}.min.js`,
    format: "cjs",
    sourcemap: debug ? true : false,
  },
  plugins: [
    // 启动静态服务
    debug &&
      serve({
        port: 3001,
        open: true,
        contentBase: ["public"],
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
    commonjs({
      exclude: "node_modules/socket.io-client/**",
    }),
    typescript(),
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
};
