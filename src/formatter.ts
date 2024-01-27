import { Formatter, LintResult, Warning } from 'stylelint';
import { CheckstyleReport } from './checkstyle-report';
import { XMLWriterOptions } from 'xmlbuilder2/lib/interfaces';

export const stylelintToCheckstyle = ((
    stylelintResults: LintResult[],
    _?: unknown,
    outputConfig?: XMLWriterOptions,
): string => {
    const checkStyleReport = new CheckstyleReport();
    stylelintResults.forEach((stylelintResult: LintResult) => {
        if (!stylelintResult.source) {
            return;
        }
        checkStyleReport.startFile(stylelintResult.source);
        stylelintResult.warnings.forEach((warning: Warning) => {
            checkStyleReport.addError({
                column: warning.column,
                line: warning.line,
                message: warning.text,
                severity: warning.severity,
                source: `stylelint.rules.${warning.rule}`,
            });
        });
        checkStyleReport.endFile();
    });
    return checkStyleReport.generate(outputConfig);
}) satisfies Formatter;
