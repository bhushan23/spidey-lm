// UI helper functions - testable module

export function formatContextInfo(title) {
  if (!title) return '';
  return title.length > 50 ? title.substring(0, 50) + '...' : title;
}

export function extractPageText(bodyClone) {
  // Remove non-content elements
  ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript', 'iframe'].forEach(tag => {
    bodyClone.querySelectorAll(tag).forEach(el => el.remove());
  });

  let text = bodyClone.innerText || bodyClone.textContent;
  text = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
  return text.length > 8000 ? text.substring(0, 8000) + '...' : text;
}

export function createMessageElement(content, role) {
  const div = document.createElement('div');
  div.className = 'message ' + role;
  div.textContent = content;
  return div;
}

export function serializeChatHistory(chatContainer) {
  const messages = [];
  chatContainer.querySelectorAll('.message').forEach(el => {
    if (el.classList.contains('user')) {
      messages.push({ role: 'user', content: el.textContent });
    } else if (el.classList.contains('assistant')) {
      messages.push({ role: 'assistant', content: el.textContent });
    }
  });
  return messages;
}

export function populateSelectOptions(selectElement, options, currentValue) {
  selectElement.innerHTML = '';

  if (!options || options.length === 0) {
    selectElement.innerHTML = '<option value="">No models - run: ollama pull llama3.2 or download via Ollama app</option>';
    selectElement.disabled = true;
    return;
  }

  options.forEach(option => {
    const optionEl = document.createElement('option');
    optionEl.value = option;
    optionEl.textContent = option;
    if (option === currentValue) {
      optionEl.selected = true;
    }
    selectElement.appendChild(optionEl);
  });

  selectElement.disabled = false;
}
