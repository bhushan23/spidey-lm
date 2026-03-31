// Background service worker - handles Ollama and Gemini Nano

const OLLAMA_URL = 'http://localhost:11434';
let ollamaModel = null;
let ollamaModels = [];
let currentBackend = null;
let isLoading = false;

// Check if Ollama is running
async function checkOllama() {
  try {
    console.log('Checking Ollama...');
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
    });
    if (!response.ok) return false;
    const data = await response.json();
    console.log('Ollama models:', data.models);
    return data.models && data.models.length > 0;
  } catch (e) {
    console.log('Ollama not available:', e.message);
    return false;
  }
}

// Get Ollama models
async function getOllamaModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    return data.models?.map(m => m.name) || [];
  } catch (e) {
    return [];
  }
}

// Check Gemini Nano - need to check in a page context
async function checkGeminiNano() {
  // Can't check from service worker, will check from popup
  return false;
}

// Load Ollama
async function loadOllama() {
  ollamaModels = await getOllamaModels();
  if (ollamaModels.length === 0) {
    throw new Error('No models in Ollama. Run: ollama pull llama3.2');
  }

  // Load saved model preference or use first available
  const stored = await chrome.storage.local.get('selectedModel');
  if (stored.selectedModel && ollamaModels.includes(stored.selectedModel)) {
    ollamaModel = stored.selectedModel;
  } else {
    ollamaModel = ollamaModels[0];
    await chrome.storage.local.set({ selectedModel: ollamaModel });
  }

  currentBackend = 'ollama';
  console.log('Using Ollama model:', ollamaModel);
  return { success: true, backend: 'ollama', model: ollamaModel, models: ollamaModels };
}

// Load model
async function loadModel(preferredBackend = null) {
  if (currentBackend && !preferredBackend) {
    return { success: true, backend: currentBackend, model: ollamaModel };
  }

  if (isLoading) {
    return { success: false, error: 'Already loading' };
  }

  isLoading = true;

  try {
    const hasOllama = await checkOllama();

    if (hasOllama) {
      const result = await loadOllama();
      isLoading = false;
      return result;
    }

    isLoading = false;
    return {
      success: false,
      error: 'Ollama not running. Start it with: ollama serve'
    };
  } catch (error) {
    isLoading = false;
    console.error('Load error:', error);
    return { success: false, error: error.message };
  }
}

// Generate with Ollama
async function generateOllama(message, context, systemPrompt) {
  if (!ollamaModel) {
    const loadResult = await loadModel();
    if (!loadResult.success) {
      throw new Error(loadResult.error);
    }
  }

  let system = systemPrompt || 'You are a helpful AI assistant. Be concise and helpful.';
  if (context) {
    const truncated = context.length > 8000 ? context.substring(0, 8000) + '...' : context;
    system += `\n\nWeb page content:\n\n${truncated}`;
  }

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: message }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content || '';
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request.type);

  if (request.type === 'getStatus') {
    loadModel().then(result => {
      sendResponse({
        status: result.success ? `Ready (Ollama: ${ollamaModel})` : result.error,
        statusType: result.success ? 'ready' : 'error',
        backend: currentBackend,
        model: ollamaModel,
        models: ollamaModels
      });
    });
    return true;
  }

  if (request.type === 'setModel') {
    if (ollamaModels.includes(request.model)) {
      ollamaModel = request.model;
      chrome.storage.local.set({ selectedModel: ollamaModel });
      console.log('Switched to model:', ollamaModel);
      sendResponse({ success: true, model: ollamaModel });
    } else {
      sendResponse({ success: false, error: 'Model not available' });
    }
    return true;
  }

  if (request.type === 'loadModel') {
    loadModel(request.backend).then(sendResponse);
    return true;
  }

  if (request.type === 'generate') {
    generateOllama(request.message, request.context, request.systemPrompt)
      .then(text => sendResponse({ success: true, text, backend: 'ollama' }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return false;
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Spidey LM installed');
  loadModel();
});
