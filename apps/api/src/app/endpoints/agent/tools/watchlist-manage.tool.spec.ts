import { ToolContext } from '../interfaces/agent.interfaces';
import { createWatchlistManageTool } from './watchlist-manage.tool';

describe('createWatchlistManageTool', () => {
  const mockContext: ToolContext = {
    userId: 'test-user-id',
    baseCurrency: 'USD',
    user: { id: 'test-user-id' } as any
  };

  function buildTool(
    overrides: {
      watchlistItems?: any[];
      searchItems?: any[];
    } = {}
  ) {
    const mockWatchlistService = {
      getWatchlistItems: jest
        .fn()
        .mockResolvedValue(overrides.watchlistItems ?? []),
      createWatchlistItem: jest.fn().mockResolvedValue(undefined),
      deleteWatchlistItem: jest.fn().mockResolvedValue(undefined)
    } as any;

    const mockDataProviderService = {
      search: jest.fn().mockResolvedValue({
        items: overrides.searchItems ?? []
      })
    } as any;

    const tool = createWatchlistManageTool(
      mockContext,
      mockWatchlistService,
      mockDataProviderService
    );

    return { tool, mockWatchlistService, mockDataProviderService };
  }

  it('should have the correct name', () => {
    const { tool } = buildTool();

    expect(tool.name).toBe('watchlist_manage');
  });

  describe('view action', () => {
    it('should return the user watchlist with performance data', async () => {
      const { tool } = buildTool({
        watchlistItems: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            dataSource: 'YAHOO',
            marketCondition: 'NEUTRAL',
            trend50d: 'UP',
            trend200d: 'UP',
            performances: {
              allTimeHigh: {
                performancePercent: -0.05,
                date: '2025-01-15'
              }
            }
          }
        ]
      });

      const result = JSON.parse(await tool.invoke({ action: 'view' }));

      expect(result.action).toBe('view');
      expect(result.totalItems).toBe(1);
      expect(result.watchlist[0].symbol).toBe('AAPL');
      expect(result.watchlist[0].name).toBe('Apple Inc.');
      expect(result.watchlist[0].performanceFromATH).toBe('-5.00%');
      expect(result.retrievedAt).toBeDefined();
    });

    it('should return empty watchlist', async () => {
      const { tool } = buildTool({ watchlistItems: [] });

      const result = JSON.parse(await tool.invoke({ action: 'view' }));

      expect(result.totalItems).toBe(0);
      expect(result.watchlist).toEqual([]);
    });
  });

  describe('add action', () => {
    it('should add a symbol with explicit dataSource', async () => {
      const { tool, mockWatchlistService } = buildTool();

      const result = JSON.parse(
        await tool.invoke({
          action: 'add',
          symbol: 'AAPL',
          dataSource: 'YAHOO'
        })
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('add');
      expect(result.symbol).toBe('AAPL');
      expect(mockWatchlistService.createWatchlistItem).toHaveBeenCalledWith({
        dataSource: 'YAHOO',
        symbol: 'AAPL',
        userId: 'test-user-id'
      });
    });

    it('should auto-resolve dataSource via search if not provided', async () => {
      const { tool, mockWatchlistService } = buildTool({
        searchItems: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            dataSource: 'YAHOO',
            currency: 'USD',
            dataProviderInfo: {}
          }
        ]
      });

      const result = JSON.parse(
        await tool.invoke({ action: 'add', symbol: 'AAPL' })
      );

      expect(result.success).toBe(true);
      expect(mockWatchlistService.createWatchlistItem).toHaveBeenCalledWith({
        dataSource: 'YAHOO',
        symbol: 'AAPL',
        userId: 'test-user-id'
      });
    });

    it('should return error if symbol not found during auto-resolve', async () => {
      const { tool } = buildTool({ searchItems: [] });

      const result = JSON.parse(
        await tool.invoke({ action: 'add', symbol: 'XYZFAKE' })
      );

      expect(result.error).toBe(true);
      expect(result.message).toContain('Could not find symbol');
    });

    it('should return error if symbol is missing', async () => {
      const { tool } = buildTool();

      const result = JSON.parse(await tool.invoke({ action: 'add' }));

      expect(result.error).toBe(true);
      expect(result.message).toContain('symbol is required');
    });

    it('should return error for invalid dataSource', async () => {
      const { tool } = buildTool();

      const result = JSON.parse(
        await tool.invoke({
          action: 'add',
          symbol: 'AAPL',
          dataSource: 'INVALID_SOURCE'
        })
      );

      expect(result.error).toBe(true);
      expect(result.message).toContain('Invalid data source');
    });
  });

  describe('remove action', () => {
    it('should remove a symbol from the watchlist', async () => {
      const { tool, mockWatchlistService } = buildTool();

      const result = JSON.parse(
        await tool.invoke({
          action: 'remove',
          symbol: 'MSFT',
          dataSource: 'YAHOO'
        })
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('remove');
      expect(result.symbol).toBe('MSFT');
      expect(mockWatchlistService.deleteWatchlistItem).toHaveBeenCalledWith({
        dataSource: 'YAHOO',
        symbol: 'MSFT',
        userId: 'test-user-id'
      });
    });

    it('should return error if symbol is missing for remove', async () => {
      const { tool } = buildTool();

      const result = JSON.parse(await tool.invoke({ action: 'remove' }));

      expect(result.error).toBe(true);
      expect(result.message).toContain('symbol is required');
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      const mockWatchlistService = {
        createWatchlistItem: jest
          .fn()
          .mockRejectedValue(new Error('Database connection failed'))
      } as any;

      const mockDataProviderService = { search: jest.fn() } as any;

      const tool = createWatchlistManageTool(
        mockContext,
        mockWatchlistService,
        mockDataProviderService
      );

      const result = JSON.parse(
        await tool.invoke({
          action: 'add',
          symbol: 'AAPL',
          dataSource: 'YAHOO'
        })
      );

      expect(result.error).toBe(true);
      expect(result.message).toBe('Database connection failed');
      expect(result.suggestion).toBeDefined();
    });

    it('should only affect the authenticated user', async () => {
      const { tool, mockWatchlistService } = buildTool();

      await tool.invoke({ action: 'view' });

      expect(mockWatchlistService.getWatchlistItems).toHaveBeenCalledWith(
        'test-user-id'
      );
    });
  });
});
