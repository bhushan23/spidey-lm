import { renderMarkdown } from './lib/markdown.js';

// DOM elements
const statusEl = document.getElementById('status');
const modelSelect = document.getElementById('model-select');
const contextInfo = document.getElementById('context-info');
const summarizeBtn = document.getElementById('summarize-btn');
const keypointsBtn = document.getElementById('keypoints-btn');
const explainBtn = document.getElementById('explain-btn');
const chatContainer = document.getElementById('chat');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const clearContextBtn = document.getElementById('clear-context-btn');
const refreshBtn = document.getElementById('refresh-btn');

let pageContext = null;
let isGenerating = false;

// Initialize
async function init() {
  updateStatus('(loading...)', 'loading');

  try {
    const response = await chrome.runtime.sendMessage({ type: 'getStatus' });

    if (response.statusType === 'ready') {
      updateStatus('(ready to chat)', 'ready');
      enableUI();
      populateModelSelector(response.models, response.model);
    } else {
      updateStatus('(error)', 'error');
    }
  } catch (error) {
    updateStatus('(error)', 'error');
  }

  // Load saved context
  const stored = await chrome.storage.local.get(['pageContext', 'chatHistory']);
  if (stored.pageContext) {
    pageContext = stored.pageContext;
    updateContextUI();
  }
  if (stored.chatHistory) {
    stored.chatHistory.forEach(msg => addMessage(msg.content, msg.role, false));
  }
}

// Populate model selector dropdown
function populateModelSelector(models, currentModel) {
  modelSelect.innerHTML = '';

  if (!models || models.length === 0) {
    modelSelect.innerHTML = '<option value="">No models available</option>';
    modelSelect.disabled = true;
    return;
  }

  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    if (model === currentModel) {
      option.selected = true;
    }
    modelSelect.appendChild(option);
  });

  modelSelect.disabled = false;
}

// Handle model change
async function handleModelChange() {
  const selectedModel = modelSelect.value;
  if (!selectedModel) return;

  modelSelect.disabled = true;
  updateStatus('(switching...)', 'loading');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'setModel',
      model: selectedModel
    });

    if (response.success) {
      updateStatus('(ready to chat)', 'ready');
    } else {
      updateStatus('(error)', 'error');
    }
  } catch (error) {
    updateStatus('(error)', 'error');
  }

  modelSelect.disabled = false;
}

function updateStatus(text, type = '') {
  statusEl.textContent = text;
  statusEl.className = 'status-indicator ' + type;
}

function enableUI() {
  inputEl.disabled = false;
  sendBtn.disabled = false;
  summarizeBtn.disabled = false;
  keypointsBtn.disabled = false;
  explainBtn.disabled = false;
}

function disableUI() {
  inputEl.disabled = true;
  sendBtn.disabled = true;
  summarizeBtn.disabled = true;
  keypointsBtn.disabled = true;
  explainBtn.disabled = true;
}

function updateContextUI() {
  if (pageContext) {
    const title = pageContext.title.length > 50 ? pageContext.title.substring(0, 50) + '...' : pageContext.title;
    contextInfo.textContent = title;
    contextInfo.className = 'context-info active';
  } else {
    contextInfo.textContent = '';
    contextInfo.className = 'context-info';
  }
}

function addMessage(content, role, save = true) {
  const div = document.createElement('div');
  div.className = 'message ' + role;
  div.dataset.raw = content; // Store raw content for saving

  if (role === 'assistant') {
    div.innerHTML = renderMarkdown(content);
  } else {
    div.textContent = content;
  }

  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  if (save) saveChat();
  return div;
}

async function saveChat() {
  const messages = [];
  chatContainer.querySelectorAll('.message').forEach(el => {
    if (el.classList.contains('user')) {
      messages.push({ role: 'user', content: el.dataset.raw || el.textContent });
    } else if (el.classList.contains('assistant')) {
      messages.push({ role: 'assistant', content: el.dataset.raw || el.textContent });
    }
  });
  await chrome.storage.local.set({ chatHistory: messages });
}

// Capture page
async function capturePage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const clone = document.body.cloneNode(true);
        ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript', 'iframe'].forEach(tag => {
          clone.querySelectorAll(tag).forEach(el => el.remove());
        });
        let text = clone.innerText || clone.textContent;
        text = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
        return text.length > 8000 ? text.substring(0, 8000) + '...' : text;
      }
    });

    if (results?.[0]?.result) {
      pageContext = {
        title: tab.title,
        url: tab.url,
        content: results[0].result
      };
      await chrome.storage.local.set({ pageContext });
      updateContextUI();
      return true;
    }
  } catch (error) {
    if (error.message?.includes('cannot be scripted')) {
      addMessage('Cannot capture this page (protected).', 'system');
    } else {
      addMessage('Capture failed: ' + error.message, 'system');
    }
  }
  return false;
}

// Send message
async function sendMessage(userMessage, systemPrompt = null) {
  if (isGenerating) return;

  isGenerating = true;
  disableUI();

  addMessage(userMessage, 'user');
  const assistantDiv = addMessage('Thinking...', 'assistant');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'generate',
      message: userMessage,
      context: pageContext?.content,
      systemPrompt
    });

    if (response?.success) {
      assistantDiv.dataset.raw = response.text;
      assistantDiv.innerHTML = renderMarkdown(response.text);
    } else {
      const errorMsg = 'Error: ' + (response?.error || 'Unknown error');
      assistantDiv.dataset.raw = errorMsg;
      assistantDiv.textContent = errorMsg;
    }
    saveChat();
  } catch (error) {
    assistantDiv.textContent = 'Error: ' + error.message;
  }

  isGenerating = false;
  enableUI();
}

// Quick actions with auto-capture
async function quickAction(userMessage, systemPrompt) {
  if (!pageContext) {
    const captured = await capturePage();
    if (!captured) return;
  }
  sendMessage(userMessage, systemPrompt);
}

const summarize = () => quickAction('Summarize this page', 'Provide a concise summary in 2-3 paragraphs.');
const keyPoints = () => quickAction('Key points?', 'List the 5-7 most important points as bullet points.');
const explainSimply = () => quickAction('Explain simply', 'Explain in simple terms anyone can understand.');

// Event listeners
modelSelect.addEventListener('change', handleModelChange);
summarizeBtn.addEventListener('click', summarize);
keypointsBtn.addEventListener('click', keyPoints);
explainBtn.addEventListener('click', explainSimply);

sendBtn.addEventListener('click', () => {
  const msg = inputEl.value.trim();
  if (msg) {
    inputEl.value = '';
    sendMessage(msg);
  }
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

clearBtn.addEventListener('click', async () => {
  chatContainer.innerHTML = '';
  await chrome.storage.local.remove('chatHistory');
});

clearContextBtn.addEventListener('click', async () => {
  pageContext = null;
  await chrome.storage.local.remove('pageContext');
  updateContextUI();
  addMessage('Context cleared', 'system');
});

refreshBtn.addEventListener('click', async () => {
  refreshBtn.classList.add('spinning');
  refreshBtn.disabled = true;
  await capturePage();
  refreshBtn.classList.remove('spinning');
  refreshBtn.disabled = false;
});

init();
