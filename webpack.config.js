const path = require('path');

module.exports = {
    mode: 'development',
    entry: "./src/index2.ts",
    target: "node",
    output: {
        path: path.join(__dirname, './dist'),
        publicPath: '/',
        filename: 'bundle.js'
    },
    resolve: {
        alias: { // 解析别名
            '@': path.join(__dirname, './src'),
        },
        extensions: [ '*', '.ts', '.js' ]
    },
    module: {
        rules: [
            {
                test: /\.(ts)$/,
                exclude: /node_modules/,
                loader: ['babel-loader', 'ts-loader'],
            },
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
        ],
    }
}