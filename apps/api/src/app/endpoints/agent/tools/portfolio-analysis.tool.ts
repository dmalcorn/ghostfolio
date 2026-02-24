import { PortfolioService } from '@ghostfolio/api/app/portfolio/portfolio.service';

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

import { ToolContext } from '../interfaces/agent.interfaces';

export function createPortfolioAnalysisTool(
  context: ToolContext,
  portfolioService: PortfolioService
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'portfolio_analysis',
    description:
      "Retrieves the authenticated user's portfolio holdings, allocation percentages, performance metrics, and account details. Use this for questions about the user's portfolio, holdings, investments, diversification, gains, losses, or asset allocation.",
    schema: z.object({
      dateRange: z
        .enum(['1d', '1y', '5y', 'max', 'mtd', 'wtd', 'ytd'])
        .optional()
        .describe(
          'Time range for performance data. Defaults to "max" (all time).'
        ),
      withSummary: z
        .boolean()
        .optional()
        .describe('Include portfolio summary with totals. Defaults to true.')
    }),
    func: async (input) => {
      try {
        const details = await portfolioService.getDetails({
          dateRange: input.dateRange ?? 'max',
          filters: [],
          impersonationId: undefined,
          userId: context.userId,
          withExcludedAccounts: false,
          withMarkets: true,
          withSummary: input.withSummary ?? true
        });

        const holdings = Object.values(details.holdings).map((h) => ({
          symbol: h.symbol,
          name: h.name,
          currency: h.currency,
          assetClass: h.assetClass,
          assetSubClass: h.assetSubClass,
          allocationInPercentage: (h.allocationInPercentage * 100).toFixed(2),
          quantity: h.quantity,
          marketPrice: h.marketPrice,
          valueInBaseCurrency: h.valueInBaseCurrency,
          netPerformancePercent: (h.netPerformancePercent * 100).toFixed(2),
          netPerformance: h.netPerformance,
          investment: h.investment,
          dataSource: h.dataSource,
          dateOfFirstActivity: h.dateOfFirstActivity
        }));

        const accounts = Object.entries(details.accounts).map(([id, acct]) => ({
          id,
          name: acct.name,
          currency: acct.currency,
          balance: acct.balance,
          valueInBaseCurrency: acct.valueInBaseCurrency,
          valueInPercentage: acct.valueInPercentage
        }));

        const result = {
          baseCurrency: context.baseCurrency,
          holdingsCount: holdings.length,
          holdings,
          accounts,
          summary: details.summary ?? null,
          hasErrors: details.hasErrors,
          dataRetrievedAt: new Date().toISOString()
        };

        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message:
            error instanceof Error
              ? error.message
              : 'Failed to retrieve portfolio data',
          suggestion:
            'The portfolio data could not be loaded. This may be a temporary issue — please try again.'
        });
      }
    }
  });
}
