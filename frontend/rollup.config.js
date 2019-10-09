import commonjs from "rollup-plugin-commonjs";
import minifyHTMLLiterals from "rollup-plugin-minify-html-literals";
import replace from "rollup-plugin-replace";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";

import pkg from "./package.json";

const tsconfig = process.env.NODE_ENV === "production" ? "tsconfig.json" : "tsconfig.dev.json";
const sourcemap = process.env.NODE_ENV !== "production";
const minimize = process.env.NODE_ENV === "production";
const sw = process.env.NODE_ENV === "production";

export default [
    {
        input: "src/main.ts",
        output: {
            file: "dist/main.js",
            format: "iife",
            sourcemap,
        },
        plugins: [
            resolve({
                browser: true,
                main: false,
            }),
            commonjs(),
            typescript({ tsconfig, tsconfigOverride: { compilerOptions: { module: "es2015" } } }),
            replace({
                "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
                USE_SERVICE_WORKER: sw,
                SERVICE_WORKER_CACHE_NAME: `v${pkg.version}`,
            }),
            minimize && minifyHTMLLiterals(),
            minimize && terser({ sourcemap }),
        ],
    },
    {
        input: "src/sw/main.ts",
        output: {
            file: "dist/sw.js",
            format: "iife",
            sourcemap: false,
        },
        plugins: [
            resolve({
                browser: true,
                main: false,
            }),
            commonjs(),
            typescript({ tsconfig: "src/sw/tsconfig.json", tsconfigOverride: { compilerOptions: { module: "es2015" } }  }),
            replace({
                "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
                SERVICE_WORKER_CACHE_NAME: `v${pkg.version}`,
            }),
            minimize && terser({ sourcemap }),
        ],
    }
];
