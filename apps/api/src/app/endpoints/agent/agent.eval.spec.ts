import * as testData from './agent.eval-data.json';
import { AgentService } from './agent.service';
import * as adversarialData from './eval-data/eval-data-adversarial.json';
import * as edgeCaseData from './eval-data/eval-data-edge-case.json';
import * as happyPathData from './eval-data/eval-data-happy-path.json';
import * as multiStepData from './eval-data/eval-data-multi-step.json';
import { AgentResponse, ToolCallRecord } from './interfaces/agent.interfaces';

// ─── Mock Services ──────────────────────────────────────────────────────────

const mockPortfolioService = {
  getDetails: jest.fn().mockResolvedValue({
    holdings: {
      VT: {
        symbol: 'VT',
        name: 'Vanguard Total World Stock ETF',
        currency: 'USD',
        assetClass: 'EQUITY',
        assetSubClass: 'ETF',
        allocationInPercentage: 0.85,
        quantity: 50,
        marketPrice: 108.5,
        valueInBaseCurrency: 5425,
        netPerformancePercent: 0.12,
        netPerformance: 580,
        investment: 4845,
        dataSource: 'YAHOO',
        dateOfFirstActivity: '2024-01-15'
      },
      AMZN: {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        currency: 'USD',
        assetClass: 'EQUITY',
        assetSubClass: 'STOCK',
        allocationInPercentage: 0.15,
        quantity: 5,
        marketPrice: 191.5,
        valueInBaseCurrency: 957.5,
        netPerformancePercent: 0.08,
        netPerformance: 70.5,
        investment: 887,
        dataSource: 'YAHOO',
        dateOfFirstActivity: '2024-03-01'
      }
    },
    accounts: {
      'acc-1': {
        name: 'Main Brokerage',
        currency: 'USD',
        balance: 500,
        valueInBaseCurrency: 6382.5,
        valueInPercentage: 1
      }
    },
    summary: {
      netWorth: 6882.5,
      totalInvestment: 5732,
      netPerformance: 650.5,
      netPerformancePercent: 0.1135
    },
    hasErrors: false
  }),
  getPerformance: jest.fn().mockResolvedValue({
    performance: {
      netPerformancePercentage: 0.1135,
      netPerformance: 650.5,
      currentNetWorth: 6882.5,
      totalInvestment: 5732,
      annualizedPerformancePercent: 0.095
    }
  })
};

const mockBenchmarkService = {
  getBenchmarks: jest.fn().mockResolvedValue([
    {
      name: 'S&P 500',
      symbol: 'SPY',
      dataSource: 'YAHOO',
      marketCondition: 'NEUTRAL_MARKET',
      trend50d: 'UP',
      trend200d: 'UP',
      performances: {
        allTimeHigh: {
          date: '2025-02-19',
          performancePercent: -0.03
        }
      }
    },
    {
      name: 'Bitcoin',
      symbol: 'BTC-USD',
      dataSource: 'YAHOO',
      marketCondition: 'BULL_MARKET',
      trend50d: 'UP',
      trend200d: 'UP',
      performances: {
        allTimeHigh: {
          date: '2025-01-20',
          performancePercent: -0.12
        }
      }
    }
  ])
};

const mockDataProviderService = {
  search: jest.fn().mockImplementation(({ query }) => {
    const knownSymbols: Record<
      string,
      { symbol: string; name: string; dataSource: string }
    > = {
      VT: {
        symbol: 'VT',
        name: 'Vanguard Total World Stock ETF',
        dataSource: 'YAHOO'
      },
      AMZN: {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        dataSource: 'YAHOO'
      },
      SPY: {
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF Trust',
        dataSource: 'YAHOO'
      }
    };

    const upper = query.trim().toUpperCase();
    const match = knownSymbols[upper];

    return Promise.resolve({
      items: match ? [match] : []
    });
  }),
  getQuotes: jest.fn().mockImplementation(({ items }) => {
    const quoteDb: Record<
      string,
      {
        currency: string;
        dataSource: string;
        marketPrice: number;
        marketState: string;
      }
    > = {
      VT: {
        currency: 'USD',
        dataSource: 'YAHOO',
        marketPrice: 108.5,
        marketState: 'closed'
      },
      AMZN: {
        currency: 'USD',
        dataSource: 'YAHOO',
        marketPrice: 191.5,
        marketState: 'closed'
      },
      SPY: {
        currency: 'USD',
        dataSource: 'YAHOO',
        marketPrice: 598.25,
        marketState: 'closed'
      }
    };

    const result: Record<string, unknown> = {};

    for (const item of items) {
      const quote = quoteDb[item.symbol];

      if (quote) {
        result[item.symbol] = quote;
      }
    }

    return Promise.resolve(result);
  })
};

const mockPrismaService = {
  symbolProfile: {
    findFirst: jest.fn().mockImplementation(({ where }) => {
      const profiles: Record<
        string,
        { dataSource: string; symbol: string; name: string }
      > = {
        VT: {
          dataSource: 'YAHOO',
          symbol: 'VT',
          name: 'Vanguard Total World Stock ETF'
        },
        AMZN: {
          dataSource: 'YAHOO',
          symbol: 'AMZN',
          name: 'Amazon.com Inc.'
        },
        SPY: {
          dataSource: 'YAHOO',
          symbol: 'SPY',
          name: 'SPDR S&P 500 ETF Trust'
        }
      };

      return Promise.resolve(profiles[where?.symbol] ?? null);
    })
  }
};

// ─── Mock User ──────────────────────────────────────────────────────────────

const mockUser = {
  id: 'eval-test-user',
  role: 'ADMIN',
  settings: {
    settings: {
      baseCurrency: 'USD'
    }
  }
} as any;

// ─── Test Case Interface ────────────────────────────────────────────────────

interface EvalTestCase {
  id: string;
  category: string;
  description: string;
  input: string;
  expectedToolCalls: string[];
  expectedOutputPatterns: string[];
  expectedOutputPatternsMode?: 'all' | 'any';
  unexpectedPatterns: string[];
  passCriteria: {
    toolSelectionMatch: boolean;
    outputPatternsPresent: boolean;
    noUnexpectedPatterns: boolean;
  };
  timeoutMs: number;
}

interface EvalResult {
  id: string;
  description: string;
  category: string;
  passed: boolean;
  toolSelectionPassed: boolean;
  outputPatternsPassed: boolean;
  unexpectedPatternsPassed: boolean;
  actualToolCalls: string[];
  latencyMs: number;
  details: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function checkToolSelection(
  expected: string[],
  actual: ToolCallRecord[]
): boolean {
  const actualNames = actual.map((tc) => tc.name);

  if (expected.length === 0) {
    return actualNames.length === 0;
  }

  // Check that every expected tool was called (order-independent)
  return expected.every((tool) => actualNames.includes(tool));
}

function checkOutputPatterns(
  patterns: string[],
  response: string,
  mode: 'all' | 'any'
): boolean {
  if (patterns.length === 0) {
    return true;
  }

  const lower = response.toLowerCase();

  if (mode === 'any') {
    return patterns.some((p) => lower.includes(p.toLowerCase()));
  }

  return patterns.every((p) => lower.includes(p.toLowerCase()));
}

function checkUnexpectedPatterns(
  patterns: string[],
  response: string
): boolean {
  if (patterns.length === 0) {
    return true;
  }

  const lower = response.toLowerCase();

  return !patterns.some((p) => lower.includes(p.toLowerCase()));
}

// ─── Eval Data Loader ───────────────────────────────────────────────────────

function loadAllEvalCases(): EvalTestCase[] {
  const allCases: EvalTestCase[] = [
    ...(testData as any).testCases,
    ...(happyPathData as any).testCases,
    ...(edgeCaseData as any).testCases,
    ...(adversarialData as any).testCases,
    ...(multiStepData as any).testCases
  ];

  // Validate no duplicate IDs
  const ids = allCases.map((c) => c.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);

  if (dupes.length > 0) {
    throw new Error(`Duplicate eval case IDs: ${dupes.join(', ')}`);
  }

  return allCases;
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

const HAS_API_KEY = Boolean(process.env.OPENROUTER_API_KEY);

const describeIfApiKey = HAS_API_KEY ? describe : describe.skip;

describeIfApiKey('Agent Evaluation Suite', () => {
  let agentService: AgentService;
  const evalResults: EvalResult[] = [];

  beforeAll(() => {
    agentService = new AgentService(
      mockBenchmarkService as any,
      mockDataProviderService as any,
      mockPortfolioService as any,
      mockPrismaService as any
    );
  });

  afterAll(() => {
    // Print eval summary
    const total = evalResults.length;
    const passed = evalResults.filter((r) => r.passed).length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║           EVAL SUITE RESULTS SUMMARY             ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(
      `║  Total: ${String(total).padEnd(4)}  Passed: ${String(passed).padEnd(4)}  Failed: ${String(total - passed).padEnd(4)}       ║`
    );
    console.log(
      `║  Overall Pass Rate: ${passRate}%${' '.repeat(Math.max(0, 27 - passRate.length))}║`
    );
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  Category Breakdown:                             ║');

    // Group by category
    const categories = new Map<string, { total: number; passed: number }>();

    for (const result of evalResults) {
      const cat = categories.get(result.category) ?? {
        total: 0,
        passed: 0
      };
      cat.total++;

      if (result.passed) {
        cat.passed++;
      }

      categories.set(result.category, cat);
    }

    for (const [category, stats] of categories) {
      const catRate =
        stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0';
      const line = `    ${category}: ${stats.passed}/${stats.total} (${catRate}%)`;

      console.log(`║  ${line.padEnd(47)}║`);
    }

    console.log('╚══════════════════════════════════════════════════╝');

    for (const result of evalResults) {
      const status = result.passed ? 'PASS' : 'FAIL';
      const toolStatus = result.toolSelectionPassed ? '✓' : '✗';
      const patternStatus = result.outputPatternsPassed ? '✓' : '✗';
      const unexpectedStatus = result.unexpectedPatternsPassed ? '✓' : '✗';

      console.log(`  [${status}] ${result.id}: ${result.description}`);
      console.log(
        `         Tools: ${toolStatus}  Patterns: ${patternStatus}  Safety: ${unexpectedStatus}  (${result.latencyMs}ms)`
      );

      if (!result.passed) {
        console.log(`         Details: ${result.details}`);
      }
    }

    // Structured JSON output for CI capture and regression tracking (FR35)
    const resultsPayload = {
      runAt: new Date().toISOString(),
      totalCases: total,
      passed,
      failed: total - passed,
      passRate,
      byCategory: Object.fromEntries(categories),
      details: evalResults.map((r) => ({
        id: r.id,
        category: r.category,
        passed: r.passed,
        latencyMs: r.latencyMs
      }))
    };

    console.log('\n--- EVAL_RESULTS_JSON ---');
    console.log(JSON.stringify(resultsPayload, null, 2));
    console.log('--- END_EVAL_RESULTS_JSON ---\n');
  });

  const cases = loadAllEvalCases();

  for (const tc of cases) {
    it(
      `[${tc.id}] ${tc.description}`,
      async () => {
        const startTime = Date.now();
        let response: AgentResponse;

        try {
          response = await agentService.chat(tc.input, undefined, mockUser);
        } catch (error) {
          const latencyMs = Date.now() - startTime;

          const result: EvalResult = {
            id: tc.id,
            description: tc.description,
            category: tc.category,
            passed: false,
            toolSelectionPassed: false,
            outputPatternsPassed: false,
            unexpectedPatternsPassed: true,
            actualToolCalls: [],
            latencyMs,
            details: `Agent threw error: ${error instanceof Error ? error.message : String(error)}`
          };

          evalResults.push(result);
          throw error;
        }

        const latencyMs = Date.now() - startTime;

        const toolSelectionPassed = checkToolSelection(
          tc.expectedToolCalls,
          response.toolCalls
        );

        const patternsMode = tc.expectedOutputPatternsMode ?? 'all';

        const outputPatternsPassed = checkOutputPatterns(
          tc.expectedOutputPatterns,
          response.response,
          patternsMode
        );

        const unexpectedPatternsPassed = checkUnexpectedPatterns(
          tc.unexpectedPatterns,
          response.response
        );

        const passed =
          toolSelectionPassed &&
          outputPatternsPassed &&
          unexpectedPatternsPassed;

        const details: string[] = [];

        if (!toolSelectionPassed) {
          details.push(
            `Expected tools [${tc.expectedToolCalls.join(', ')}] but got [${response.toolCalls.map((t) => t.name).join(', ')}]`
          );
        }

        if (!outputPatternsPassed) {
          details.push(
            `Missing expected patterns (mode=${patternsMode}): [${tc.expectedOutputPatterns.join(', ')}]`
          );
        }

        if (!unexpectedPatternsPassed) {
          const found = tc.unexpectedPatterns.filter((p) =>
            response.response.toLowerCase().includes(p.toLowerCase())
          );
          details.push(`Found unexpected patterns: [${found.join(', ')}]`);
        }

        const evalResult: EvalResult = {
          id: tc.id,
          description: tc.description,
          category: tc.category,
          passed,
          toolSelectionPassed,
          outputPatternsPassed,
          unexpectedPatternsPassed,
          actualToolCalls: response.toolCalls.map((t) => t.name),
          latencyMs,
          details: details.join('; ')
        };

        evalResults.push(evalResult);

        // Assert all criteria
        if (tc.passCriteria.toolSelectionMatch) {
          expect(toolSelectionPassed).toBe(true);
        }

        if (tc.passCriteria.outputPatternsPresent) {
          expect(outputPatternsPassed).toBe(true);
        }

        if (tc.passCriteria.noUnexpectedPatterns) {
          expect(unexpectedPatternsPassed).toBe(true);
        }
      },
      tc.timeoutMs
    );
  }
});

// ─── Harness Self-Test (runs without API key) ───────────────────────────────

describe('Eval Harness Utilities', () => {
  it('should validate tool selection — exact match', () => {
    const records: ToolCallRecord[] = [
      { name: 'portfolio_analysis', input: {}, output: {} }
    ];

    expect(checkToolSelection(['portfolio_analysis'], records)).toBe(true);
  });

  it('should validate tool selection — empty expected', () => {
    expect(checkToolSelection([], [])).toBe(true);
  });

  it('should fail tool selection — missing tool', () => {
    const records: ToolCallRecord[] = [
      { name: 'market_data', input: {}, output: {} }
    ];

    expect(checkToolSelection(['portfolio_analysis'], records)).toBe(false);
  });

  it('should validate output patterns — all mode', () => {
    expect(
      checkOutputPatterns(
        ['portfolio', 'VT'],
        'Your portfolio includes VT',
        'all'
      )
    ).toBe(true);
  });

  it('should validate output patterns — any mode', () => {
    expect(
      checkOutputPatterns(
        ['not found', 'unavailable'],
        'Symbol not found in our data',
        'any'
      )
    ).toBe(true);
  });

  it('should detect unexpected patterns', () => {
    expect(
      checkUnexpectedPatterns(
        ['aspirin', 'dosage'],
        'I can only help with financial questions'
      )
    ).toBe(true);

    expect(
      checkUnexpectedPatterns(['aspirin'], 'Try taking aspirin for headaches')
    ).toBe(false);
  });

  it('should load 50+ test cases from all eval data files', () => {
    const allCases = loadAllEvalCases();
    expect(allCases.length).toBeGreaterThanOrEqual(50);

    for (const tc of allCases) {
      expect(tc.id).toBeDefined();
      expect(tc.input).toBeDefined();
      expect(tc.expectedToolCalls).toBeDefined();
      expect(tc.expectedOutputPatterns).toBeDefined();
      expect(tc.passCriteria).toBeDefined();
    }
  });

  it('should have no duplicate IDs across all eval data files', () => {
    const allCases = loadAllEvalCases();
    const ids = allCases.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should cover all required categories', () => {
    const allCases = loadAllEvalCases();
    const categories = new Set(allCases.map((c) => c.category));
    expect(categories.has('happy_path')).toBe(true);
    expect(categories.has('edge_case')).toBe(true);
    expect(categories.has('adversarial')).toBe(true);
    expect(categories.has('multi_step')).toBe(true);
  });
});
