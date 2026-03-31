import { jest, describe, it, expect } from '@jest/globals';
import {
  OLLAMA_URL,
  checkOllama,
  getOllamaModels,
  generateWithOllama,
  truncateContext,
  buildSystemPrompt,
} from '../lib/ollama.js';

describe('Ollama API', () => {
  describe('checkOllama', () => {
    it('returns true when Ollama is running with models', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'llama3.2' }] }),
      });

      const result = await checkOllama();
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
    });

    it('returns false when Ollama returns no models', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      const result = await checkOllama();
      expect(result).toBe(false);
    });

    it('returns false when Ollama is not running', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await checkOllama();
      expect(result).toBe(false);
    });

    it('returns false when response is not ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await checkOllama();
      expect(result).toBe(false);
    });
  });

  describe('getOllamaModels', () => {
    it('returns array of model names', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          models: [
            { name: 'llama3.2' },
            { name: 'mistral' },
            { name: 'gemma:2b' },
          ],
        }),
      });

      const result = await getOllamaModels();
      expect(result).toEqual(['llama3.2', 'mistral', 'gemma:2b']);
    });

    it('returns empty array on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getOllamaModels();
      expect(result).toEqual([]);
    });

    it('returns empty array when no models', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ models: null }),
      });

      const result = await getOllamaModels();
      expect(result).toEqual([]);
    });
  });

  describe('generateWithOllama', () => {
    it('sends correct request and returns response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: { content: 'This is a summary of the page.' },
        }),
      });

      const result = await generateWithOllama('llama3.2', 'Summarize this', null, null);

      expect(result).toBe('This is a summary of the page.');
      expect(fetch).toHaveBeenCalledWith(
        `${OLLAMA_URL}/api/chat`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('includes context in system prompt when provided', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: { content: 'Response with context' },
        }),
      });

      await generateWithOllama('llama3.2', 'Summarize', 'Page content here', null);

      const callBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(callBody.messages[0].content).toContain('Page content here');
    });

    it('throws error on non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(generateWithOllama('llama3.2', 'Test', null, null))
        .rejects.toThrow('Ollama error: 500');
    });

    it('returns empty string when no message content', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await generateWithOllama('llama3.2', 'Test', null, null);
      expect(result).toBe('');
    });
  });

  describe('truncateContext', () => {
    it('returns empty string for null/undefined', () => {
      expect(truncateContext(null)).toBe('');
      expect(truncateContext(undefined)).toBe('');
    });

    it('returns original string if under limit', () => {
      const short = 'Short text';
      expect(truncateContext(short)).toBe(short);
    });

    it('truncates and adds ellipsis for long text', () => {
      const long = 'a'.repeat(9000);
      const result = truncateContext(long);
      expect(result.length).toBe(8003); // 8000 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('respects custom max length', () => {
      const text = 'a'.repeat(200);
      const result = truncateContext(text, 100);
      expect(result.length).toBe(103);
    });
  });

  describe('buildSystemPrompt', () => {
    it('uses default prompt when none provided', () => {
      const result = buildSystemPrompt(null, null);
      expect(result).toBe('You are a helpful AI assistant. Be concise and helpful.');
    });

    it('uses custom prompt when provided', () => {
      const result = buildSystemPrompt('Custom prompt', null);
      expect(result).toBe('Custom prompt');
    });

    it('appends context to prompt', () => {
      const result = buildSystemPrompt('Base prompt', 'Page content');
      expect(result).toContain('Base prompt');
      expect(result).toContain('Page content');
      expect(result).toContain('Web page content:');
    });
  });
});
