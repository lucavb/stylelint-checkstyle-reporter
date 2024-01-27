import { LintResult } from 'stylelint';
import getStdin from 'get-stdin';
import { stylelintToCheckstyle } from './formatter';

const run = async () => {
    let stdinString = '';
    try {
        stdinString = await getStdin();
    } catch (e) {
        console.error('Unable to read from stdin. Did you pass anything?');
        return;
    }
    let stdin: LintResult[];
    try {
        stdin = JSON.parse(stdinString);
    } catch (e) {
        console.error('Unable to parse stdin as JSON. Did you forget to use -f json?');
        return;
    }

    console.log(stylelintToCheckstyle(stdin));
};

void run();
