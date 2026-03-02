'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.sanitizeToolCallsForTrace = sanitizeToolCallsForTrace;
const DEFAULT_REDACTION_RULES = {
  portfolio_analysis: {
    holdingFields: [
      'quantity',
      'marketPrice',
      'valueInBaseCurrency',
      'netPerformance',
      'investment',
      'balance'
    ],
    accountFields: ['balance', 'valueInBaseCurrency'],
    summaryFields: ['netWorth', 'totalInvestment', 'netPerformance']
  },
  benchmark_compare: {
    portfolioFields: ['netPerformance', 'currentNetWorth', 'totalInvestment']
  }
};
/**
 * Redacts sensitive fields from tool call outputs before sending to
 * observability platforms (e.g., LangSmith traces).
 *
 * Returns a deep clone — the original toolCalls array is never mutated.
 */
function sanitizeToolCallsForTrace(toolCalls, options = {}) {
  const {
    redactionRules = DEFAULT_REDACTION_RULES,
    redactedValue = '[REDACTED]'
  } = options;
  return toolCalls.map((tc) => ({
    name: tc.name,
    input: tc.input,
    output: sanitizeToolOutput(
      tc.name,
      tc.output,
      redactionRules,
      redactedValue
    )
  }));
}
function sanitizeToolOutput(toolName, output, rules, redactedValue) {
  const rule = rules[toolName];
  if (!rule) {
    return output;
  }
  const clone = JSON.parse(JSON.stringify(output));
  if (rule.holdingFields) {
    redactArrayItems(clone, 'holdings', rule.holdingFields, redactedValue);
  }
  if (rule.accountFields) {
    redactArrayItems(clone, 'accounts', rule.accountFields, redactedValue);
  }
  if (
    rule.summaryFields &&
    clone.summary &&
    typeof clone.summary === 'object'
  ) {
    for (const field of rule.summaryFields) {
      if (field in clone.summary) {
        clone.summary[field] = redactedValue;
      }
    }
  }
  if (
    rule.portfolioFields &&
    clone.portfolio &&
    typeof clone.portfolio === 'object'
  ) {
    for (const field of rule.portfolioFields) {
      if (field in clone.portfolio) {
        clone.portfolio[field] = redactedValue;
      }
    }
  }
  return clone;
}
function redactArrayItems(output, arrayKey, fields, redactedValue) {
  if (!Array.isArray(output[arrayKey])) {
    return;
  }
  for (const item of output[arrayKey]) {
    for (const field of fields) {
      if (field in item) {
        item[field] = redactedValue;
      }
    }
  }
}
//# sourceMappingURL=trace-sanitizer.js.map
