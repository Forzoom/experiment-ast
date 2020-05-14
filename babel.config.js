module.exports = {
    presets: [
        "@babel/preset-typescript",
        "@babel/preset-env",
    ],
    plugins: [
        '@babel/plugin-transform-async-to-generator',
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
    ],
};
