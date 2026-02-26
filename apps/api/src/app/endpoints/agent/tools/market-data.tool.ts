import { DataProviderService } from '@ghostfolio/api/services/data-provider/data-provider.service';
import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';
import type { AssetProfileIdentifier } from '@ghostfolio/common/interfaces';

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

import { ToolContext } from '../interfaces/agent.interfaces';

interface ResolvedSymbol extends AssetProfileIdentifier {
  name?: string;
}

export function createMarketDataTool(
  context: ToolContext,
  dataProviderService: DataProviderService,
  prismaService: PrismaService
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'market_data',
    description:
      'Retrieves current market prices, market state (open/closed), and currency for ticker symbols. Use this for questions about stock prices, crypto prices, ETF prices, or any market quote. Accepts up to 10 symbols at once.',
    schema: z.object({
      symbols: z
        .array(z.string())
        .min(1)
        .max(10)
        .describe(
          'Array of ticker symbols to look up (e.g., ["AAPL", "MSFT", "BTC-USD"]). Maximum 10 symbols per request.'
        )
    }),
    func: async (input) => {
      try {
        const resolved: ResolvedSymbol[] = [];
        const errors: { symbol: string; error: string }[] = [];

        // Phase 1: Resolve each symbol to a dataSource
        for (const rawSymbol of input.symbols) {
          const symbol = rawSymbol.trim().toUpperCase();

          // Try database first (fast path for known symbols)
          const profile = await prismaService.symbolProfile.findFirst({
            where: { symbol },
            select: {
              dataSource: true,
              symbol: true,
              name: true
            }
          });

          if (profile) {
            resolved.push({
              dataSource: profile.dataSource,
              symbol: profile.symbol,
              name: profile.name ?? undefined
            });
            continue;
          }

          // Fallback: search external providers
          try {
            const searchResult = await dataProviderService.search({
              query: symbol,
              user: context.user
            });

            const match = searchResult.items.find(
              (item) => item.symbol.toUpperCase() === symbol
            );

            if (match) {
              resolved.push({
                dataSource: match.dataSource,
                symbol: match.symbol,
                name: match.name
              });
            } else {
              errors.push({
                symbol,
                error: `Symbol "${symbol}" not found. Check the ticker symbol and try again.`
              });
            }
          } catch {
            errors.push({
              symbol,
              error: `Could not search for "${symbol}". The data provider may be temporarily unavailable.`
            });
          }
        }

        // Phase 2: Batch fetch quotes for all resolved symbols
        const quotes: Record<
          string,
          {
            symbol: string;
            name: string | undefined;
            currency: string;
            dataSource: string;
            marketPrice: number;
            marketState: string;
          }
        > = {};

        if (resolved.length > 0) {
          const items: AssetProfileIdentifier[] = resolved.map(
            ({ dataSource, symbol }) => ({ dataSource, symbol })
          );

          const quoteData = await dataProviderService.getQuotes({
            items,
            user: context.user
          });

          for (const r of resolved) {
            const quote = quoteData[r.symbol];

            if (quote) {
              quotes[r.symbol] = {
                symbol: r.symbol,
                name: r.name,
                currency: quote.currency,
                dataSource: String(quote.dataSource),
                marketPrice: quote.marketPrice,
                marketState: quote.marketState
              };
            } else {
              errors.push({
                symbol: r.symbol,
                error: `Quote data unavailable for "${r.symbol}".`
              });
            }
          }
        }

        const result = {
          quotes,
          errors: errors.length > 0 ? errors : undefined,
          retrievedAt:
            new Date().toLocaleString('en-US', {
              timeZone: 'America/New_York'
            }) + ' ET'
        };

        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          error: true,
          message:
            error instanceof Error
              ? error.message
              : 'Failed to retrieve market data',
          suggestion:
            'Market data could not be loaded. This may be a temporary issue — please try again.'
        });
      }
    }
  });
}
