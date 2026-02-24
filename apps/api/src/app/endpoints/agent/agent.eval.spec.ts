import * as testData from './agent.eval-data.json';
import { AgentService } from './agent.service';
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

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║         EVAL SUITE RESULTS SUMMARY           ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Total:  ${total}                                  ║`);
    console.log(
      `║  Passed: ${passed}   Failed: ${total - passed}                        ║`
    );
    console.log(
      `║  Pass Rate: ${total > 0 ? ((passed / total) * 100).toFixed(0) : 0}%                              ║`
    );
    console.log('╚══════════════════════════════════════════════╝');

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

    console.log('');
  });

  const cases = (testData as any).testCases as EvalTestCase[];

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

  it('should load test cases from JSON', () => {
    const cases = (testData as any).testCases;
    expect(cases.length).toBeGreaterThanOrEqual(5);

    for (const tc of cases) {
      expect(tc.id).toBeDefined();
      expect(tc.input).toBeDefined();
      expect(tc.expectedToolCalls).toBeDefined();
      expect(tc.expectedOutputPatterns).toBeDefined();
      expect(tc.passCriteria).toBeDefined();
    }
  });
});
