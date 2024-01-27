// needs to be adapted to your project
const { stylelintToCheckstyle } = require('../dist/stylelint-checkstyle-reporter.cjs');

module.exports = function (results) {
    return stylelintToCheckstyle(results, undefined, {
        prettyPrint: true,
        indent: ' '.repeat(4),
    });
};
