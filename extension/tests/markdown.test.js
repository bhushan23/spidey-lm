import { describe, it, expect } from '@jest/globals';
import { renderMarkdown } from '../lib/markdown.js';

describe('Markdown Renderer', () => {
  describe('basic text', () => {
    it('returns empty string for empty input', () => {
      expect(renderMarkdown('')).toBe('');
      expect(renderMarkdown(null)).toBe('');
      expect(renderMarkdown(undefined)).toBe('');
    });

    it('escapes HTML to prevent XSS', () => {
      const result = renderMarkdown('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('bold text', () => {
    it('renders **text** as bold', () => {
      const result = renderMarkdown('This is **bold** text');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('renders __text__ as bold', () => {
      const result = renderMarkdown('This is __bold__ text');
      expect(result).toContain('<strong>bold</strong>');
    });
  });

  describe('italic text', () => {
    it('renders *text* as italic', () => {
      const result = renderMarkdown('This is *italic* text');
      expect(result).toContain('<em>italic</em>');
    });

    it('renders _text_ as italic', () => {
      const result = renderMarkdown('This is _italic_ text');
      expect(result).toContain('<em>italic</em>');
    });
  });

  describe('code', () => {
    it('renders `code` as inline code', () => {
      const result = renderMarkdown('Use `console.log()` here');
      expect(result).toContain('<code>console.log()</code>');
    });

    it('renders code blocks', () => {
      const result = renderMarkdown('```\nconst x = 1;\n```');
      expect(result).toContain('<pre><code>');
      expect(result).toContain('const x = 1;');
    });
  });

  describe('lists', () => {
    it('renders unordered lists with -', () => {
      const result = renderMarkdown('- item 1\n- item 2');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>item 1</li>');
      expect(result).toContain('<li>item 2</li>');
    });

    it('renders unordered lists with *', () => {
      const result = renderMarkdown('* item 1\n* item 2');
      expect(result).toContain('<li>item 1</li>');
    });
  });

  describe('headers', () => {
    it('renders # as h3', () => {
      const result = renderMarkdown('# Header');
      expect(result).toContain('<h3>Header</h3>');
    });

    it('renders ## as h3', () => {
      const result = renderMarkdown('## Header');
      expect(result).toContain('<h3>Header</h3>');
    });

    it('renders ### as h4', () => {
      const result = renderMarkdown('### Header');
      expect(result).toContain('<h4>Header</h4>');
    });
  });

  describe('strikethrough', () => {
    it('renders ~~text~~ as strikethrough', () => {
      const result = renderMarkdown('This is ~~deleted~~ text');
      expect(result).toContain('<del>deleted</del>');
    });
  });

  describe('line breaks', () => {
    it('converts newlines to <br>', () => {
      const result = renderMarkdown('Line 1\nLine 2');
      expect(result).toContain('<br>');
    });
  });
});
