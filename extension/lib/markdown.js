// Simple markdown renderer for chat messages

export function renderMarkdown(text) {
  if (!text) return '';

  // Escape HTML to prevent XSS
  let html = escapeHtml(text);

  // Code blocks (```code```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers (# text) - must come before other formatting
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h3>$1</h3>');

  // Unordered lists (- item or * item) - must come before italic
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists (1. item)
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_) - only match when not at line start
  html = html.replace(/(?<!^|\n)\*([^*\n]+)\*/g, '<em>$1</em>');
  html = html.replace(/(?<!^|\n)_([^_\n]+)_/g, '<em>$1</em>');

  // Strikethrough (~~text~~)
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  // Clean up extra breaks around block elements
  html = html.replace(/<br>\s*(<\/?(?:ul|ol|li|pre|h[1-4])>)/g, '$1');
  html = html.replace(/(<\/?(?:ul|ol|li|pre|h[1-4])>)\s*<br>/g, '$1');

  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Extract plain text from rendered content (for saving)
export function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
