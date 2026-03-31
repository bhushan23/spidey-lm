// Ollama API client - testable module

export const OLLAMA_URL = 'http://localhost:11434';

export async function checkOllama() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.models && data.models.length > 0;
  } catch (e) {
    return false;
  }
}

export async function getOllamaModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    return data.models?.map(m => m.name) || [];
  } catch (e) {
    return [];
  }
}

export async function generateWithOllama(model, message, context, systemPrompt) {
  let system = systemPrompt || 'You are a helpful AI assistant. Be concise and helpful.';
  if (context) {
    const truncated = context.length > 8000 ? context.substring(0, 8000) + '...' : context;
    system += `\n\nWeb page content:\n\n${truncated}`;
  }

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
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

export function truncateContext(context, maxLength = 8000) {
  if (!context) return '';
  return context.length > maxLength ? context.substring(0, maxLength) + '...' : context;
}

export function buildSystemPrompt(basePrompt, context) {
  let system = basePrompt || 'You are a helpful AI assistant. Be concise and helpful.';
  if (context) {
    system += `\n\nWeb page content:\n\n${truncateContext(context)}`;
  }
  return system;
}
