import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  formatContextInfo,
  createMessageElement,
  serializeChatHistory,
  populateSelectOptions,
} from '../lib/ui-helpers.js';

describe('UI Helpers', () => {
  describe('formatContextInfo', () => {
    it('returns empty string for missing title or content', () => {
      expect(formatContextInfo(null, 'content')).toBe('');
      expect(formatContextInfo('title', null)).toBe('');
      expect(formatContextInfo(null, null)).toBe('');
    });

    it('formats context info with word count', () => {
      const result = formatContextInfo('Page Title', 'one two three four five');
      expect(result).toBe('Page Title (5 words)');
    });

    it('truncates long titles', () => {
      const longTitle = 'This is a very long page title that exceeds thirty characters';
      const result = formatContextInfo(longTitle, 'content here');
      expect(result).toContain('...');
      expect(result.length).toBeLessThan(longTitle.length + 20);
    });
  });

  describe('createMessageElement', () => {
    it('creates div with correct class and content', () => {
      const el = createMessageElement('Hello world', 'user');
      expect(el.tagName).toBe('DIV');
      expect(el.className).toBe('message user');
      expect(el.textContent).toBe('Hello world');
    });

    it('handles assistant role', () => {
      const el = createMessageElement('Response', 'assistant');
      expect(el.className).toBe('message assistant');
    });

    it('handles system role', () => {
      const el = createMessageElement('System message', 'system');
      expect(el.className).toBe('message system');
    });
  });

  describe('serializeChatHistory', () => {
    it('extracts user and assistant messages', () => {
      const container = document.createElement('div');

      const userMsg = document.createElement('div');
      userMsg.className = 'message user';
      userMsg.textContent = 'User question';
      container.appendChild(userMsg);

      const assistantMsg = document.createElement('div');
      assistantMsg.className = 'message assistant';
      assistantMsg.textContent = 'Assistant response';
      container.appendChild(assistantMsg);

      const result = serializeChatHistory(container);
      expect(result).toEqual([
        { role: 'user', content: 'User question' },
        { role: 'assistant', content: 'Assistant response' },
      ]);
    });

    it('ignores system messages', () => {
      const container = document.createElement('div');

      const systemMsg = document.createElement('div');
      systemMsg.className = 'message system';
      systemMsg.textContent = 'System notification';
      container.appendChild(systemMsg);

      const result = serializeChatHistory(container);
      expect(result).toEqual([]);
    });

    it('returns empty array for empty container', () => {
      const container = document.createElement('div');
      const result = serializeChatHistory(container);
      expect(result).toEqual([]);
    });
  });

  describe('populateSelectOptions', () => {
    let select;

    beforeEach(() => {
      select = document.createElement('select');
    });

    it('populates select with options', () => {
      populateSelectOptions(select, ['model1', 'model2', 'model3'], 'model2');

      expect(select.options.length).toBe(3);
      expect(select.options[0].value).toBe('model1');
      expect(select.options[1].value).toBe('model2');
      expect(select.options[1].selected).toBe(true);
      expect(select.disabled).toBe(false);
    });

    it('shows "No models available" when empty', () => {
      populateSelectOptions(select, [], null);

      expect(select.options.length).toBe(1);
      expect(select.options[0].textContent).toBe('No models available');
      expect(select.disabled).toBe(true);
    });

    it('handles null options', () => {
      populateSelectOptions(select, null, null);

      expect(select.disabled).toBe(true);
    });

    it('does not explicitly select any option if current not found', () => {
      populateSelectOptions(select, ['model1', 'model2'], 'nonexistent');

      // Browser default: first option is selected, but not via our code
      expect(select.value).toBe('model1');
    });
  });
});
