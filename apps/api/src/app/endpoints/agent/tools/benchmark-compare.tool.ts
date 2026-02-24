import { PortfolioService } from '@ghostfolio/api/app/portfolio/portfolio.service';
import { BenchmarkService } from '@ghostfolio/api/services/benchmark/benchmark.service';
import { DataProviderService } from '@ghostfolio/api/services/data-provider/data-provider.service';

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

import { ToolContext } from '../interfaces/agent.interfaces';

export function createBenchmarkCompareTool(
  context: ToolContext,
  benchmarkService: BenchmarkService,
  dataProviderService: DataProviderService,
  portfolioService: PortfolioService
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'benchmark_compare',
    description:
      'Lists available market benchmarks or compares portfolio performance against a specific benchmark. Use "list" mode to show available benchmarks (e.g., S&P 500, Bitcoin). Use "compare" mode to compare the user\'s portfolio returns against a benchmark over a time range.',
    schema: z.object({
      mode: z
        .enum(['list', 'compare'])
        .describe(
          '"list" returns available benchmarks with market conditions and trends. "compare" compares portfolio performance against a specific benchmark.'
        ),
      benchmarkSymbol: z
        .string()
        .optional()
        .describe(
          'The benchmark symbol to compare against (e.g., "SPY" for S&P 500 ETF). Required for "compare" mode. Use "list" mode first to see available symbols.'
        ),
      dateRange: z
        .enum(['1d', '1y', '5y', 'max', 'mtd', 'wtd', 'ytd'])
        .optional()
        .describe(
          'Time range for the comparison. Defaults to "ytd" (year to date).'
        )
    }),
    func: async (input) => {
      try {
        const benchmarks = await benchmarkService.getBenchmarks();

        if (input.mode === 'list') {
          const result = {
            mode: 'list',
            benchmarks: benchmarks.map((b) => ({
              name: b.name,
              symbol: b.symbol,
              dataSource: String(b.dataSource),
              marketCondition: b.marketCondition,
              trend50d: b.trend50d,
              trend200d: b.trend200d,
              allTimeHighDate: b.performances.allTimeHigh.date,
              performanceFromATH:
                (
                  b.performances.allTimeHigh.performancePercent * 100
                ).toFixed(2) + '%'
            })),
            retrievedAt: new Date().toISOString()
          };

          return JSON.stringify(result);
        }

        // Compare mode
        if (!input.benchmarkSymbol) {
          return JSON.stringify({
            error: true,
            message:
              'A benchmark symbol is required for compare mode.',
            suggestion:
              'Use "list" mode first to see available benchmarks, then specify a benchmarkSymbol.',
            availableBenchmarks: benchmarks.map((b) => ({
              name: b.name,
              symbol: b.symbol
            }))
          });
        }

        const targetSymbol = input.benchmarkSymbol
          .trim()
          .toUpperCase();
        const benchmark = benchmarks.find(
          (b) => b.symbol.toUpperCase() === targetSymbol
        );

        if (!benchmark) {
          return JSON.stringify({
            error: true,
            message: `Benchmark "${input.benchmarkSymbol}" is not configured.`,
            suggestion:
              'Choose from the available benchmarks listed below.',
            availableBenchmarks: benchmarks.map((b) => ({
              name: b.name,
              symbol: b.symbol
            }))
          });
        }

        const dateRange = input.dateRange ?? 'ytd';

        // Get portfolio performance for the date range
        const portfolioPerformance =
          await portfolioService.getPerformance({
            dateRange,
            filters: [],
            impersonationId: undefined,
            userId: context.userId
          });

        // Get current benchmark quote
        let benchmarkPrice: number | undefined;

        try {
          const quotes = await dataProviderService.getQuotes({
            items: [
              {
                dataSource: benchmark.dataSource,
                symbol: benchmark.symbol
              }
            ],
            user: context.user
          });

          benchmarkPrice =
            quotes[benchmark.symbol]?.marketPrice;
        } catch {
          // Quote fetch failed — continue with available data
        }

        const perf = portfolioPerformance.performance;

        const result = {
          mode: 'compare',
          dateRange,
          portfolio: {
            netPerformancePercent:
              perf.netPerformancePercentage != null
                ? Number(
                    (perf.netPerformancePercentage * 100).toFixed(
                      2
                    )
                  )
                : null,
            netPerformance: perf.netPerformance,
            currentNetWorth: perf.currentNetWorth ?? null,
            totalInvestment: perf.totalInvestment,
            annualizedPerformancePercent:
              perf.annualizedPerformancePercent != null
                ? Number(
                    (
                      perf.annualizedPerformancePercent * 100
                    ).toFixed(2)
                  )
                : null,
            baseCurrency: context.baseCurrency
          },
          benchmark: {
            name: benchmark.name,
            symbol: benchmark.symbol,
            dataSource: String(benchmark.dataSource),
            currentPrice: benchmarkPrice ?? null,
            marketCondition: benchmark.marketCondition,
            performanceFromATH:
              (
                benchmark.performances.allTimeHigh
                  .performancePercent * 100
              ).toFixed(2) + '%',
            allTimeHighDate:
              benchmark.performances.allTimeHigh.date,
            trend50d: benchmark.trend50d,
            trend200d: benchmark.trend200d
          },
          retrievedAt: new Date().toISOString()
        };

        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message:
            error instanceof Error
              ? error.message
              : 'Failed to retrieve benchmark data',
          suggestion:
            'Benchmark data could not be loaded. This may be a temporary issue — please try again.'
        });
      }
    }
  });
}
