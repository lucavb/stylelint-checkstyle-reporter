import typescript from '@rollup/plugin-typescript';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import terser from '@rollup/plugin-terser';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
const dependencies = Object.keys(pkg.dependencies || {});
const peerDependencies = Object.keys(pkg.peerDependencies || {});

// The TypeScript plugin emits one CommonJS-flavoured index.d.ts, which TypeScript
// pairs with both builds. Importers resolving the ESM build therefore get CJS
// declarations ("masquerading as CJS"), so the import condition points at this
// ESM-flavoured wrapper instead.
const esmTypeShim = {
    name: 'esm-type-shim',
    writeBundle() {
        writeFileSync(
            resolve('dist/index.d.mts'),
            "import { stylelintToCheckstyle } from './index.js';\n" +
                "export * from './index.js';\n" +
                'export default stylelintToCheckstyle;\n',
        );
    },
};

export default [
    // ESM build
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/stylelint-checkstyle-reporter.mjs',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [typescript({ tsconfig: './tsconfig.app.json' }), terser(), esmTypeShim],
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
