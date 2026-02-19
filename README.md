# ChatGPT Quick Actions

Performs one-shot AI actions on selected text using Raycast. Supports **OpenAI**, **Anthropic (Claude)**, and **Ollama (local)** as API providers, plus browser automation to send queries to ChatGPT, Claude, and Grok web UIs.

<a title="Install chatgpt-quick-actions Raycast Extension" href="https://www.raycast.com/alanzchen/chatgpt-quick-actions"><img src="https://www.raycast.com/alanzchen/chatgpt-quick-actions/install_button@2x.png" height="64" alt="" style="height: 64px;"></a>

https://user-images.githubusercontent.com/2144783/232259860-dcf47f25-cd1b-4612-a430-fedf58fabe28.mp4

## Features

- Results stream in real time
- **Multi-provider**: OpenAI, Anthropic, or Ollama (local) — switch with a single preference
- **Tone selector**: professional, casual, academic, concise, creative (on summarize, rewrite, refine, custom)
- **Paste-in-place mode**: paste AI result directly instead of showing a preview window
- **Browser automation**: send text to ChatGPT, Claude, or Grok web UIs in Safari or Chrome
- Supports keyboard binding with specific commands
- Supports custom prompt for each action
- Per-command model override

## Setup

Set your **API Provider** in the extension preferences:

| Provider | Required Settings |
|---|---|
| **OpenAI** (default) | `OpenAI API Key`, `Global Model` |
| **Anthropic** | `Anthropic API Key`, `Global Model` (e.g., `claude-sonnet-4-6`) |
| **Ollama** | `Ollama Endpoint` (default: `http://localhost:11434`), `Ollama Model` (default: `llama3`) |

## Tips

- Specify a global preferred model or customize the model for each command.
- Regenerate results with `Cmd + R` if you are not satisfied.
- Retry with `Cmd + Shift + R` to temporarily use GPT-5 (OpenAI provider only).
- Set **Output Mode** to "Paste directly" to have results pasted in-place without opening a preview window.
- Set a **Tone** on text-transform commands to control the output style.

## Supported Models

**OpenAI**: `gpt-5.2`, `gpt-5.1`, `gpt-5.1-codex`, `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `gpt-4o`, `gpt-4o-mini`

**Anthropic**: `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5`

**Ollama**: Any locally installed model.

## Development

```bash
npm install
npm run dev          # Raycast dev mode (hot reload)
npm run build        # production build
npm run lint         # lint check
npm run fix-lint     # auto-fix lint issues
```
