const path = require('path');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const builtins = require('rollup-plugin-node-builtins');
const babel = require('@rollup/plugin-babel').babel;
const alias = require('@rollup/plugin-alias');
const extensions = [ '.ts', '.js' ];

module.exports = exports = [
    {
        input: './src/index.ts',
        output: {
            file: './dist/experiment-ast.esm.js',
            format: 'esm',
        },
        plugins: [
            resolve({
                extensions,
                preferBuiltins: true,
            }),
            builtins(),
            alias({
                entries: [
                    { find: '@', replacement: path.join(__dirname, '../src') }
                ],
            }),
            commonjs(),
            babel({
                babelHelpers: 'runtime',
                exclude: 'node_modules/**',
                extensions,
            }),
        ],
    },
    {
        input: './src/index.ts',
        output: {
            file: './dist/experiment-ast.cjs.js',
            format: 'cjs',
        },
        plugins: [
            resolve({
                babelHelpers: 'runtime',
                extensions,
                preferBuiltins: true,
            }),
            // builtins(),
            alias({
                entries: [
                    { find: '@', replacement: path.join(__dirname, '../src') }
                ],
            }),
            commonjs(),
            babel({
                babelHelpers: 'runtime',
                exclude: 'node_modules/**',
                extensions,
            }),
        ],
    },
    {
        input: './src/index.ts',
        output: {
            file: './dist/experiment-ast.js',
            name: 'LargeList',
            format: 'umd',
        },
        plugins: [
            resolve({
                babelHelpers: 'runtime',
                extensions,
                preferBuiltins: true,
            }),
            builtins(),
            alias({
                entries: [
                    { find: '@', replacement: path.join(__dirname, '../src') }
                ],
            }),
            commonjs(),
            babel({
                babelHelpers: 'runtime',
                exclude: 'node_modules/**',
                extensions,
            }),
        ],
    },
];