const name = "lowercase_v"

export default [
    {
        input: 'src/index.js',
        output: {
            file: `${__dirname}/dist/${name}.js`,
            format: "umd",
            name
        }
    }, {
        input: 'src/index.js',
        output: {
            file: `${__dirname}/dist/${name}.module.js`,
            format: "module",
            name
        }
    }
]