import { ToolContext } from '../interfaces/agent.interfaces';
import { createSymbolSearchTool } from './symbol-search.tool';

describe('createSymbolSearchTool', () => {
  const mockContext: ToolContext = {
    userId: 'test-user-id',
    baseCurrency: 'USD',
    user: { id: 'test-user-id' } as any
  };

  function buildTool(searchResult = { items: [] }) {
    const mockDataProviderService = {
      search: jest.fn().mockResolvedValue(searchResult)
    } as any;

    const tool = createSymbolSearchTool(mockContext, mockDataProviderService);

    return { tool, mockDataProviderService };
  }

  it('should have the correct name and description', () => {
    const { tool } = buildTool();

    expect(tool.name).toBe('symbol_search');
    expect(tool.description).toContain('ticker symbols');
  });

  it('should return matching symbols with name, dataSource, and currency', async () => {
    const { tool } = buildTool({
      items: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          dataSource: 'YAHOO',
          assetClass: 'EQUITY',
          assetSubClass: 'STOCK',
          currency: 'USD',
          dataProviderInfo: {}
        }
      ]
    });

    const result = JSON.parse(await tool.invoke({ query: 'Apple' }));

    expect(result.totalResults).toBe(1);
    expect(result.results[0]).toEqual({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      dataSource: 'YAHOO',
      assetClass: 'EQUITY',
      assetSubClass: 'STOCK',
      currency: 'USD'
    });
    expect(result.retrievedAt).toBeDefined();
  });

  it('should return multiple results', async () => {
    const { tool } = buildTool({
      items: [
        {
          symbol: 'BITO',
          name: 'ProShares Bitcoin Strategy ETF',
          dataSource: 'YAHOO',
          assetClass: 'EQUITY',
          assetSubClass: 'ETF',
          currency: 'USD',
          dataProviderInfo: {}
        },
        {
          symbol: 'GBTC',
          name: 'Grayscale Bitcoin Trust',
          dataSource: 'YAHOO',
          assetClass: 'EQUITY',
          assetSubClass: 'ETF',
          currency: 'USD',
          dataProviderInfo: {}
        }
      ]
    });

    const result = JSON.parse(await tool.invoke({ query: 'crypto ETF' }));

    expect(result.totalResults).toBe(2);
    expect(result.results[0].symbol).toBe('BITO');
    expect(result.results[1].symbol).toBe('GBTC');
  });

  it('should reject queries shorter than 2 characters', async () => {
    const { tool, mockDataProviderService } = buildTool();

    const result = JSON.parse(await tool.invoke({ query: 'A' }));

    expect(result.error).toBe(true);
    expect(result.message).toContain('at least 2 characters');
    expect(mockDataProviderService.search).not.toHaveBeenCalled();
  });

  it('should return a message when no results are found', async () => {
    const { tool } = buildTool({ items: [] });

    const result = JSON.parse(await tool.invoke({ query: 'xyznonexistent' }));

    expect(result.totalResults).toBe(0);
    expect(result.results).toEqual([]);
    expect(result.message).toContain('No results found');
  });

  it('should handle data provider errors gracefully', async () => {
    const mockDataProviderService = {
      search: jest.fn().mockRejectedValue(new Error('Provider timeout'))
    } as any;

    const tool = createSymbolSearchTool(mockContext, mockDataProviderService);

    const result = JSON.parse(await tool.invoke({ query: 'Apple' }));

    expect(result.error).toBe(true);
    expect(result.message).toBe('Provider timeout');
    expect(result.suggestion).toBeDefined();
  });

  it('should pass the user context to the search service', async () => {
    const { tool, mockDataProviderService } = buildTool({ items: [] });

    await tool.invoke({ query: 'Tesla' });

    expect(mockDataProviderService.search).toHaveBeenCalledWith({
      query: 'Tesla',
      user: mockContext.user
    });
  });

  it('should trim whitespace from query', async () => {
    const { tool, mockDataProviderService } = buildTool({ items: [] });

    await tool.invoke({ query: '  Apple  ' });

    expect(mockDataProviderService.search).toHaveBeenCalledWith({
      query: 'Apple',
      user: mockContext.user
    });
  });
});
