import { DataProviderService } from '@ghostfolio/api/services/data-provider/data-provider.service';

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

import { ToolContext } from '../interfaces/agent.interfaces';

export function createSymbolSearchTool(
  context: ToolContext,
  dataProviderService: DataProviderService
): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'symbol_search',
    description:
      'Searches for ticker symbols and financial instruments by name or keyword. Use this when the user wants to find a symbol (e.g., "Find me crypto ETFs", "What is the ticker for Tesla?", "Search for bond funds"). Returns matching symbols with names, data sources, asset classes, and currencies.',
    schema: z.object({
      query: z
        .string()
        .describe(
          'The search term to look up (e.g., "Tesla", "crypto ETF", "S&P 500"). Must be at least 2 characters.'
        )
    }),
    func: async (input) => {
      try {
        const query = input.query.trim();

        if (query.length < 2) {
          return JSON.stringify({
            error: true,
            message:
              'Please provide a more specific search term (at least 2 characters).',
            suggestion:
              'Try a longer search query like a company name, sector, or asset type.'
          });
        }

        const searchResult = await dataProviderService.search({
          query,
          user: context.user
        });

        if (searchResult.items.length === 0) {
          return JSON.stringify({
            results: [],
            query,
            totalResults: 0,
            message: `No results found for "${query}". Try a different search term or check the spelling.`,
            retrievedAt: new Date().toISOString()
          });
        }

        const results = searchResult.items.map((item) => ({
          symbol: item.symbol,
          name: item.name,
          dataSource: String(item.dataSource),
          assetClass: item.assetClass,
          assetSubClass: item.assetSubClass,
          currency: item.currency
        }));

        return JSON.stringify({
          results,
          query,
          totalResults: results.length,
          retrievedAt: new Date().toISOString()
        });
      } catch (error) {
        return JSON.stringify({
          error: true,
          message:
            error instanceof Error
              ? error.message
              : 'Failed to search for symbols',
          suggestion:
            'Symbol search could not be completed. This may be a temporary issue — please try again.'
        });
      }
    }
  });
}
