export default {
    input: 'es/index.js',
    output: {
        file: 'index.js',
        format: 'umd',
        exports: 'named'
    },
    name: 'SArray',
    external: ['s-js'],
    globals: { 's-js': "S"}
}