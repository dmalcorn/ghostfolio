import { WatchlistService } from '@ghostfolio/api/app/endpoints/watchlist/watchlist.service';
import { DataProviderService } from '@ghostfolio/api/services/data-provider/data-provider.service';

import { DynamicStructuredTool } from '@langchain/core/tools';
import { DataSource } from '@prisma/client';
import { z } from 'zod';

import { ToolContext } from '../interfaces/agent.interfaces';

export function createWatchlistManageTool(
  context: ToolContext,
  watchlistService: WatchlistService,
  dataProviderService: DataProviderService
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'watchlist_manage',
    description:
      'Manages the user\'s watchlist of financial instruments. Use "view" to show the current watchlist with performance data. Use "add" to add a symbol (requires symbol and dataSource). Use "remove" to remove a symbol. When the user says "Add AAPL to my watchlist" or "Show me my watchlist" or "Remove MSFT from my watchlist", use this tool.',
    schema: z.object({
      action: z
        .enum(['view', 'add', 'remove'])
        .describe(
          '"view" lists all watchlist items. "add" adds a symbol. "remove" removes a symbol.'
        ),
      symbol: z
        .string()
        .optional()
        .describe(
          'The ticker symbol to add or remove (e.g., "AAPL"). Required for "add" and "remove" actions.'
        ),
      dataSource: z
        .string()
        .optional()
        .describe(
          'The data source for the symbol (e.g., "YAHOO", "COINGECKO"). Required for "add" and "remove" actions. Use symbol_search first if unsure.'
        )
    }),
    func: async (input) => {
      try {
        if (input.action === 'view') {
          const items = await watchlistService.getWatchlistItems(
            context.userId
          );

          return JSON.stringify({
            action: 'view',
            watchlist: items.map((item) => ({
              symbol: item.symbol,
              name: item.name,
              dataSource: String(item.dataSource),
              marketCondition: item.marketCondition,
              trend50d: item.trend50d,
              trend200d: item.trend200d,
              performanceFromATH:
                item.performances?.allTimeHigh?.performancePercent != null
                  ? (
                      item.performances.allTimeHigh.performancePercent * 100
                    ).toFixed(2) + '%'
                  : null,
              allTimeHighDate: item.performances?.allTimeHigh?.date ?? null
            })),
            totalItems: items.length,
            retrievedAt:
              new Date().toLocaleString('en-US', {
                timeZone: 'America/New_York'
              }) + ' ET'
          });
        }

        // Validate required fields for add/remove
        if (!input.symbol) {
          return JSON.stringify({
            error: true,
            message: `A symbol is required for the "${input.action}" action.`,
            suggestion:
              'Please specify a ticker symbol. Use the symbol_search tool first if you need to find one.'
          });
        }

        if (!input.dataSource) {
          // Try to resolve the dataSource via search
          try {
            const searchResult = await dataProviderService.search({
              query: input.symbol,
              user: context.user
            });

            const match = searchResult.items.find(
              (item) => item.symbol.toUpperCase() === input.symbol.toUpperCase()
            );

            if (match) {
              input.dataSource = String(match.dataSource);
            } else {
              return JSON.stringify({
                error: true,
                message: `Could not find symbol "${input.symbol}". Please verify the symbol and data source.`,
                suggestion:
                  'Use the symbol_search tool first to find the correct symbol and data source.'
              });
            }
          } catch {
            return JSON.stringify({
              error: true,
              message: 'A data source is required and automatic lookup failed.',
              suggestion:
                'Use the symbol_search tool first to find the correct symbol and data source, then try again.'
            });
          }
        }

        const symbol = input.symbol.trim().toUpperCase();
        const dataSource = input.dataSource as DataSource;

        if (!Object.values(DataSource).includes(dataSource)) {
          return JSON.stringify({
            error: true,
            message: `Invalid data source "${input.dataSource}".`,
            suggestion: `Valid data sources are: ${Object.values(DataSource).join(', ')}`
          });
        }

        if (input.action === 'add') {
          await watchlistService.createWatchlistItem({
            dataSource,
            symbol,
            userId: context.userId
          });

          return JSON.stringify({
            action: 'add',
            symbol,
            dataSource: String(dataSource),
            success: true,
            message: `${symbol} has been added to your watchlist.`,
            retrievedAt:
              new Date().toLocaleString('en-US', {
                timeZone: 'America/New_York'
              }) + ' ET'
          });
        }

        if (input.action === 'remove') {
          await watchlistService.deleteWatchlistItem({
            dataSource,
            symbol,
            userId: context.userId
          });

          return JSON.stringify({
            action: 'remove',
            symbol,
            dataSource: String(dataSource),
            success: true,
            message: `${symbol} has been removed from your watchlist.`,
            retrievedAt:
              new Date().toLocaleString('en-US', {
                timeZone: 'America/New_York'
              }) + ' ET'
          });
        }

        return JSON.stringify({
          error: true,
          message: `Unknown action "${input.action}".`
        });
      } catch (error) {
        return JSON.stringify({
          error: true,
          message:
            error instanceof Error
              ? error.message
              : 'Failed to manage watchlist',
          suggestion:
            'Watchlist operation could not be completed. This may be a temporary issue — please try again.'
        });
      }
    }
  });
}
