# Spidey LM

Friendly neighborhood chrome plugin that runs entirely on-device for privacy to help with what you browse.

## Features

- Summarize any web page
- Extract key points
- Explain content simply
- Ask custom questions about page content
- Select from all your downloaded Ollama models
- Fully local - no data sent to external servers

## Prerequisites

- [Ollama](https://ollama.ai) installed and running
- At least one model downloaded (e.g., `ollama pull llama3.2`)

## Setup

### 1. Configure Ollama for Chrome Extension Access

Chrome extensions require CORS access to localhost. Run this once:

```bash
launchctl setenv OLLAMA_ORIGINS "*"
```

Then quit and restart the Ollama app.

**Alternative:** Start Ollama from terminal with:
```bash
OLLAMA_ORIGINS="*" ollama serve
```

### 2. Install the Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this repo

### 3. Download a Model (if you haven't)

```bash
ollama pull llama3.2
```

Other recommended models:
- `llama3.2` - Fast, good for summarization
- `mistral` - Good balance of speed and quality
- `llama3.1` - More capable, slower

## Usage

1. Click the Spidey LM icon in your Chrome toolbar
2. Select your preferred model from the dropdown
3. Use quick actions (Summarize, Key Points, Explain Simply) or ask your own questions - page content is captured automatically

## Testing

Run unit tests:

```bash
cd extension
npm install
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Troubleshooting

### "Ollama error: 403"
Ollama isn't configured for Chrome extension access. See Setup step 1.

### "Ollama not running"
Start Ollama app or run `ollama serve` in terminal.

### "No models available"
Download a model: `ollama pull llama3.2`

## License

Apache 2.0
