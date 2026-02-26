import {
  AIMessage,
  HumanMessage,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages
} from '@langchain/core/messages';

import { AgentService } from './agent.service';

describe('Conversation Persistence', () => {
  describe('LangChain message serialization roundtrip', () => {
    it('should serialize and deserialize HumanMessage', () => {
      const original = [new HumanMessage('What is my portfolio?')];
      const stored = mapChatMessagesToStoredMessages(original);
      const json = JSON.stringify(stored);
      const parsed = JSON.parse(json);
      const restored = mapStoredMessagesToChatMessages(parsed);

      expect(restored).toHaveLength(1);
      expect(restored[0].content).toBe('What is my portfolio?');
      expect(restored[0]._getType()).toBe('human');
    });

    it('should serialize and deserialize AIMessage', () => {
      const original = [new AIMessage('Your portfolio contains VT and AMZN.')];
      const stored = mapChatMessagesToStoredMessages(original);
      const json = JSON.stringify(stored);
      const parsed = JSON.parse(json);
      const restored = mapStoredMessagesToChatMessages(parsed);

      expect(restored).toHaveLength(1);
      expect(restored[0].content).toBe('Your portfolio contains VT and AMZN.');
      expect(restored[0]._getType()).toBe('ai');
    });

    it('should serialize and deserialize a full conversation', () => {
      const original = [
        new HumanMessage('Show my holdings'),
        new AIMessage('You have VT (85%) and AMZN (15%).'),
        new HumanMessage('What about performance?'),
        new AIMessage('Your portfolio is up 11.35% overall.')
      ];

      const stored = mapChatMessagesToStoredMessages(original);
      const json = JSON.stringify(stored);
      const parsed = JSON.parse(json);
      const restored = mapStoredMessagesToChatMessages(parsed);

      expect(restored).toHaveLength(4);
      expect(restored[0]._getType()).toBe('human');
      expect(restored[1]._getType()).toBe('ai');
      expect(restored[2]._getType()).toBe('human');
      expect(restored[3]._getType()).toBe('ai');
      expect(restored[0].content).toBe('Show my holdings');
      expect(restored[3].content).toBe('Your portfolio is up 11.35% overall.');
    });

    it('should handle empty array', () => {
      const stored = mapChatMessagesToStoredMessages([]);
      const json = JSON.stringify(stored);
      const parsed = JSON.parse(json);
      const restored = mapStoredMessagesToChatMessages(parsed);

      expect(restored).toHaveLength(0);
    });
  });

  describe('Redis integration via AgentService', () => {
    let agentService: AgentService;
    let mockRedis: {
      get: jest.Mock;
      set: jest.Mock;
      remove: jest.Mock;
    };

    beforeEach(() => {
      mockRedis = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined)
      };

      agentService = new AgentService(
        {} as any, // benchmarkService
        {} as any, // dataProviderService
        {} as any, // portfolioService
        {} as any, // prismaService
        mockRedis as any // redisCacheService
      );
    });

    it('should call Redis get with correct key pattern', async () => {
      const convId = 'test-conv-123';

      // Access the private method via bracket notation for testing
      const history = await (agentService as any).getConversationHistory(
        convId
      );

      expect(mockRedis.get).toHaveBeenCalledWith(
        `agent:conversation:${convId}`
      );
      expect(history).toEqual([]);
    });

    it('should deserialize stored messages from Redis', async () => {
      const messages = [new HumanMessage('Hello'), new AIMessage('Hi there!')];
      const stored = mapChatMessagesToStoredMessages(messages);

      mockRedis.get.mockResolvedValue(JSON.stringify(stored));

      const history = await (agentService as any).getConversationHistory(
        'test-conv'
      );

      expect(history).toHaveLength(2);
      expect(history[0].content).toBe('Hello');
      expect(history[1].content).toBe('Hi there!');
    });

    it('should save messages to Redis with correct key and TTL', async () => {
      await (agentService as any).saveConversationHistory(
        'test-conv',
        'User message',
        'Agent reply'
      );

      expect(mockRedis.set).toHaveBeenCalledWith(
        'agent:conversation:test-conv',
        expect.any(String),
        86_400_000 // 24 hours
      );

      // Verify the stored content is valid
      const storedJson = mockRedis.set.mock.calls[0][1];
      const parsed = JSON.parse(storedJson);

      expect(parsed).toHaveLength(2);
    });

    it('should return empty array when Redis fails', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection lost'));

      const history = await (agentService as any).getConversationHistory(
        'test-conv'
      );

      expect(history).toEqual([]);
    });

    it('should not throw when save fails', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis connection lost'));

      await expect(
        (agentService as any).saveConversationHistory(
          'test-conv',
          'msg',
          'reply'
        )
      ).resolves.toBeUndefined();
    });
  });
});
