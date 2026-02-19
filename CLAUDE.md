# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Raycast extension ("ChatGPT Quick Actions") that performs one-shot AI actions on selected text. Supports multiple AI providers (OpenAI, Anthropic, Ollama) via API and browser automation (AppleScript) to send queries to ChatGPT/Claude/Grok web UIs.

## Build & Dev Commands

```bash
npm run dev          # ray develop — start Raycast dev mode (hot reload)
npm run build        # ray build -e dist
npm run lint         # ray lint (uses @raycast eslint config)
npm run fix-lint     # ray lint --fix
```

No test framework is configured. Verify changes via `npm run lint` and `npm run build`.

## Architecture

### Command Patterns

Every command exports a default function/component from `src/`. Commands are registered in `package.json` under `commands[]` with either `"mode": "view"` (shows UI) or `"mode": "no-view"` (background action).

**1. API-based commands (view mode)** — call AI provider with streaming, display result in `Detail` view or paste directly:
- Thin wrappers that call `ResultView(prompt, model_override, toast_title, tone?)` from `src/common.tsx`
- Examples: `summarize.tsx`, `rewrite.tsx`, `refine.tsx`, `custom.tsx`, `preview.tsx`
- Pattern: read preferences for prompt + model override + tone, pass to `ResultView`
- `outputMode` preference controls behavior: `"preview"` (Detail view) or `"paste"` (paste directly + close)

**2. Browser automation commands (no-view mode)** — use AppleScript to open Safari/Chrome, paste text into AI web UIs, and submit:
- All use `sendToAIPlatformWithBrowser()` from `src/ai_platform_utils.ts`
- Examples: `bulletPoints.tsx`, `customSearch.tsx`, `codeExplainer.tsx`, `emailComposer.tsx`, `paraphrase.tsx`, `open_chatgpt.tsx`, `quick_response.tsx`, `simple_explain.tsx`, `refine-search.tsx`
- Each reads `aiPlatform`, `browser`, `tabBehavior` preferences — supports ChatGPT, Claude, Grok, or custom URL

**3. Standalone commands** — direct API calls without `ResultView`:
- `execute.ts` — sends selected text via `createCompletion()`, pastes response directly (no UI)
- `transform.tsx` — takes a user-provided prompt argument, uses `createCompletion()`
- `setReminder.tsx`, `googleSearch.tsx`, `linkOpener.tsx` — macOS automation without AI

### Key Shared Modules

| File | Purpose |
|---|---|
| `src/api.ts` | Multi-provider API layer. Exports `createStream()`, `createCompletion()`, `getModel()`, `apiProvider`. Supports OpenAI, Anthropic SDK, and Ollama (via OpenAI SDK pointed at Ollama's `/v1` endpoint). |
| `src/common.tsx` | `ResultView` — streaming response component with retry, tone injection, paste-in-place mode, token counting, cost estimation, SideNote integration |
| `src/ai_platform_utils.ts` | Browser automation: open/reuse tabs, focus text areas, paste+send via AppleScript. Supports Safari & Chrome. |
| `src/util.ts` | Token counting (`@nem035/gpt-3-encoder`), `MODEL_PRICING` lookup table for cost estimation, AppleScript helpers |

### Multi-Provider API (`src/api.ts`)

- **`apiProvider`** global preference: `"openai"` | `"anthropic"` | `"ollama"`
- **`createStream(model, systemPrompt, userMessage)`** — async generator yielding `{ text, done }` chunks. Routes to Anthropic SDK `.messages.stream()` or OpenAI SDK `.chat.completions.create({ stream: true })` based on provider.
- **`createCompletion(model, userMessage)`** — non-streaming, returns `string`. Used by `execute.ts`, `transform.tsx`, search refinement commands.
- **`getModel(model_override)`** — resolves `"global"` to the configured default model (or Ollama model name for Ollama provider).
- Ollama uses OpenAI SDK with `baseURL: "${ollamaEndpoint}/v1"` — no raw `fetch()`.

### Preferences System

- **Global preferences** (in root `preferences[]` of `package.json`): API provider, API keys (OpenAI, Anthropic), Ollama endpoint/model, default model, default browser, output mode, SideNote toggle
- **Per-command preferences** (in each command's `preferences[]`): custom prompt text, model override (defaults to `"global"`), tone (for text-transform commands)
- Model dropdown lists are duplicated across every command's preferences in `package.json` — when adding a new model, update the global dropdown AND every command's `model_*` dropdown
- Model dropdowns include both OpenAI and Claude models; the active provider determines which are usable
- Current OpenAI models: `gpt-5.2`, `gpt-5.1`, `gpt-5.1-codex`, `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`
- Current Claude models: `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5`

### Tone/Style System

- Text-transform commands (`summarize`, `rewrite`, `refine`, `custom`) accept an optional `tone` preference
- Values: `default`, `professional`, `casual`, `academic`, `concise`, `creative`
- `TONE_INSTRUCTIONS` map in `common.tsx` appends tone instruction to the system prompt

### Pricing (`src/util.ts`)

- `MODEL_PRICING` lookup object: `Record<string, [input_per_1M, output_per_1M]>` in dollars
- Covers GPT-5.x, GPT-4.1, GPT-4o, legacy GPT-4/3.5, and Claude Opus/Sonnet/Haiku
- Returns `-1` for unknown models (e.g., Ollama local models)

### AI Platforms (Browser Automation)

Defined in `ai_platform_utils.ts`:
- ChatGPT: `chatgpt.com/?temporary-chat=true`, selector `textarea`
- Claude: `claude.ai/new`, selector `.ProseMirror`
- Grok: `grok.com/`, selector `.grok-chat-input`
- Custom: user-provided URL + CSS selector via per-command preferences

### AppleScript Considerations

Browser automation relies on macOS AppleScript. Chrome requires "Allow JavaScript from Apple Events" (View > Developer). The code handles this permission error with `isChromeJSPermissionError()` and falls back to System Events keystroke automation.
