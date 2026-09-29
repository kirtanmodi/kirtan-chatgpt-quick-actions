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

Use Node >=22.22.2 for `@raycast/api` 2.5.3 and install with `npm ci`. Rerun `npm run dev` after manifest changes to refresh Raycast's preferences; Ctrl+C stops the watcher while keeping the extension installed. Stop development after verification. Obtain approval for the expected cost before a live, potentially billed API request.

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
| `src/common.tsx` | `ResultView` — streaming response, retry, tone, paste mode, manual text fallback, token/cost estimates, SideNote integration |
| `src/ai_platform_utils.ts` | Browser automation: open/reuse tabs, focus text areas, paste+send via AppleScript. Supports Safari & Chrome. |
| `src/util.ts` | Token counting (`@nem035/gpt-3-encoder`), `MODEL_PRICING` lookup table for cost estimation, AppleScript helpers |

### Multi-Provider API (`src/api.ts`)

- **`apiProvider`** global preference: `"openai"` | `"anthropic"` | `"ollama"`
- **`createStream(model, systemPrompt, userMessage)`** — async generator yielding `{ text, done }` chunks. Routes to Anthropic SDK `.messages.stream()` or OpenAI SDK `.chat.completions.create({ stream: true })` based on provider.
- **`createCompletion(model, userMessage)`** — non-streaming, returns `string`. Used by `execute.ts`, `transform.tsx`, search refinement commands.
- **`getModel(model_override)`** — uses the command override unless it is empty or `"global"`, then uses the saved global choice (default `gpt-6-luna`). OpenAI falls back to Luna for a Claude choice; Anthropic falls back to `claude-haiku-4-5` for a non-Claude choice. Ollama always uses its own model preference.
- Ollama uses OpenAI SDK with `baseURL: "${ollamaEndpoint}/v1"` — no raw `fetch()`.

### Preferences System

- **Global preferences** (in root `preferences[]` of `package.json`): API provider, API keys (OpenAI, Anthropic), Ollama endpoint/model, default model, default browser, output mode, SideNote toggle
- **Per-command preferences** (in each command's `preferences[]`): custom prompt text, model override (defaults to `"global"`), tone (for text-transform commands)
- Model dropdowns are static and duplicated in `package.json`. Add a new choice to the global dropdown and all eight `model_*` dropdowns: summarize, rewrite, refine, custom, execute, preview, transform, transform_preview. Update `MODEL_PRICING`, README, and the handover PDF together. Existing older Claude choices are global-only.
- Preserve saved preferences: a new manifest default does not replace a user's saved model. Provider compatibility is handled by `getModel()`.
- The current model catalog is listed in README; do not promise automatic discovery or a forever-cheapest model. Check official provider IDs, endpoint support, prices, and account access before updating it.

### Result Input and Retry

- `ResultView` rejects missing/blank selected text before an API request. Its **Type Text Instead** form works in preview and paste modes; it does not apply to no-view execute/transform commands.
- Manual text is stored in the view and reused on retry. Selected-text retries read the selection again.
- Pass the requested model directly into `getResult()` when switching models; React state updates are asynchronous.
- OpenAI's GPT-6.1 Sol retry switches the model for the current view. It is a paid request and costs more than the Luna default.

### Tone/Style System

- Text-transform commands (`summarize`, `rewrite`, `refine`, `custom`) accept an optional `tone` preference
- Values: `default`, `professional`, `casual`, `academic`, `concise`, `creative`
- `TONE_INSTRUCTIONS` map in `common.tsx` appends tone instruction to the system prompt

### Pricing (`src/util.ts`)

- `MODEL_PRICING` lookup object: `Record<string, [input_per_1M, output_per_1M]>` in dollars
- Covers recent GPT-6 and Claude models plus older entries. Check official prices and keep the source/check date near the table.
- `estimatePrice()` returns cents rounded to three decimals, or `-1` for unknown models (including unlisted Ollama names).
- Counts use `@nem035/gpt-3-encoder` on visible text. These are estimates, not API usage or billing; hidden reasoning, caching, tiers, and provider tokenizers are not represented.
- Missing text displays zero; failed requests display Unknown. Accumulate tokens only on completion and costs only for completed requests with known prices, using functional React state updates. Totals reset when the view closes.

### Handover Document

- `docs/build_handover.py` is the editable source for `docs/ai-models-handover.pdf`. Requires Python `reportlab`; regenerate after feature changes and visually inspect the PDF pages.

### AI Platforms (Browser Automation)

Defined in `ai_platform_utils.ts`:
- ChatGPT: `chatgpt.com/?temporary-chat=true`, selector `textarea`
- Claude: `claude.ai/new`, selector `.ProseMirror`
- Grok: `grok.com/`, selector `.grok-chat-input`
- Custom: user-provided URL + CSS selector via per-command preferences

### AppleScript Considerations

Browser automation relies on macOS AppleScript. Chrome requires "Allow JavaScript from Apple Events" (View > Developer). The code handles this permission error with `isChromeJSPermissionError()` and falls back to System Events keystroke automation.
