import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

// Release notes break silently: a mismatched preset/writer pair, or an unknown
// preset option, produces notes with missing sections or leaked chore commits
// without failing the build. Exercise the configured generator and analyzer the
// way a release would run them.
//
// semantic-release v26 and its plugins require Node >= 26.13. The library itself
// still supports older LTS lines, so these checks are skipped where the release
// tooling cannot run at all.
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
const releaseToolingSupported = nodeMajor > 26 || (nodeMajor === 26 && nodeMinor >= 13);
const describeRelease = releaseToolingSupported ? describe : describe.skip;

const COMMIT_ANALYZER = '@semantic-release/commit-analyzer';
const RELEASE_NOTES_GENERATOR = '@semantic-release/release-notes-generator';

type PluginEntry = string | [string, Record<string, unknown>];

const releaseConfig = JSON.parse(readFileSync('.releaserc.json', 'utf8')) as { plugins: PluginEntry[] };

const pluginConfig = (pluginName: string): Record<string, unknown> => {
    const entry = releaseConfig.plugins.find(
        (plugin): plugin is [string, Record<string, unknown>] => Array.isArray(plugin) && plugin[0] === pluginName,
    );

    if (entry === undefined) {
        throw new Error(`.releaserc.json does not configure ${pluginName}`);
    }

    return entry[1];
};

const commits = [
    { hash: 'a1b2c3d', message: 'feat(api)!: add export endpoint\n\nBREAKING CHANGE: the api changed' },
    { hash: 'd4e5f6a', message: 'fix: handle empty response' },
    { hash: 'e5f6a7b', message: 'fix(deps): update dependency xmlbuilder2 to v4' },
    { hash: 'b7c8d9e', message: 'chore(deps): update dependency semantic-release to v26' },
    { hash: 'c8d9e0f', message: 'docs: tweak readme' },
];

const releaseContext = (selected = commits) => ({
    cwd: process.cwd(),
    commits: selected,
    branch: { name: 'main' },
    lastRelease: { version: '1.1.2', gitTag: 'v1.1.2', gitHead: '0000000' },
    nextRelease: { version: '2.0.0', gitTag: 'v2.0.0', type: 'major', gitHead: 'a1b2c3d' },
    options: { repositoryUrl: 'https://github.com/lucavb/stylelint-checkstyle-reporter.git' },
    logger: { log: () => undefined, error: () => undefined },
});

describeRelease('release configuration', () => {
    it.each([
        ['feat!: support node 22 and later', 'major'],
        ['feat(api)!: add export endpoint', 'major'],
        ['fix: handle empty response', 'patch'],
        ['perf: speed up report writing', 'patch'],
        ['chore(deps): update dependency semantic-release to v26', null],
        ['fix(deps): update dependency xmlbuilder2 to v4', null],
        ['docs: tweak readme', null],
    ])('derives a release from %s', async (message, expected) => {
        const { analyzeCommits } = await import(COMMIT_ANALYZER);

        const releaseType = await analyzeCommits(pluginConfig(COMMIT_ANALYZER), {
            ...releaseContext(),
            commits: [{ hash: 'abc1234', message }],
        });

        expect(releaseType).toBe(expected);
    });

    it('generates notes with sections and hides non-release commit types', async () => {
        const { generateNotes } = await import(RELEASE_NOTES_GENERATOR);

        const notes = await generateNotes(pluginConfig(RELEASE_NOTES_GENERATOR), releaseContext());

        expect(notes).toContain('BREAKING CHANGES');
        expect(notes).toContain('### Features');
        expect(notes).toContain('**api:** add export endpoint');
        expect(notes).toContain('### Bug Fixes');
        expect(notes).toContain('handle empty response');

        // Regression guard: `hidden: true` is silently ignored by preset v10+,
        // which leaked every chore and docs commit into the release notes.
        expect(notes).not.toContain('update dependency semantic-release');
        expect(notes).not.toContain('tweak readme');
        expect(notes).not.toContain('Miscellaneous Chores');
        expect(notes).not.toContain('### Documentation');
    });
});
