import { ToolCallRecord } from '../types';

export interface TraceSanitizerOptions {
  /**
   * Map of tool names to the fields that should be redacted from their output.
   * Each entry specifies which fields to replace with '[REDACTED]'.
   *
   * Default configuration redacts sensitive financial data:
   * - portfolio tools: quantity, marketPrice, valueInBaseCurrency, netPerformance, investment, balance
   * - benchmark tools: netPerformance, currentNetWorth, totalInvestment
   */
  redactionRules?: Record<string, RedactionRule>;
  /** The replacement string for redacted values (default: '[REDACTED]') */
  redactedValue?: string;
}

export interface RedactionRule {
  /** Fields to redact in holdings array items */
  holdingFields?: string[];
  /** Fields to redact in account array items */
  accountFields?: string[];
  /** Fields to redact in the summary object */
  summaryFields?: string[];
  /** Fields to redact in a nested 'portfolio' object (e.g., benchmark comparison) */
  portfolioFields?: string[];
}

const DEFAULT_REDACTION_RULES: Record<string, RedactionRule> = {
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
export function sanitizeToolCallsForTrace(
  toolCalls: ToolCallRecord[],
  options: TraceSanitizerOptions = {}
): ToolCallRecord[] {
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

function sanitizeToolOutput(
  toolName: string,
  output: object,
  rules: Record<string, RedactionRule>,
  redactedValue: string
): object {
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

function redactArrayItems(
  output: Record<string, unknown>,
  arrayKey: string,
  fields: string[],
  redactedValue: string
): void {
  if (!Array.isArray(output[arrayKey])) {
    return;
  }

  for (const item of output[arrayKey] as Record<string, unknown>[]) {
    for (const field of fields) {
      if (field in item) {
        item[field] = redactedValue;
      }
    }
  }
}
