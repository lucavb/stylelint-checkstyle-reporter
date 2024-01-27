import typescript from '@rollup/plugin-typescript';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import terser from '@rollup/plugin-terser';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
const dependencies = Object.keys(pkg.dependencies || {});
const peerDependencies = Object.keys(pkg.peerDependencies || {});

export default [
    // ESM build
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/stylelint-checkstyle-reporter.mjs',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [typescript({ tsconfig: './tsconfig.app.json' }), terser()],
        external: [...dependencies, ...peerDependencies],
    },
    // CommonJS build
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/stylelint-checkstyle-reporter.cjs',
            format: 'cjs',
            sourcemap: true,
        },
        plugins: [typescript({ tsconfig: './tsconfig.app.json' }), terser()],
        external: [...dependencies, ...peerDependencies],
    },

    {
        input: 'src/reporter-with-stdin.ts',
        output: {
            file: 'dist/reporter-with-stdin.mjs',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [typescript({ tsconfig: './tsconfig.app.json' }), terser()],
        external: [...dependencies, ...peerDependencies],
    },
];
