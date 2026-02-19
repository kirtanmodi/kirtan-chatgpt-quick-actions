# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Raycast extension ("ChatGPT Quick Actions") that performs one-shot AI actions on selected text. Uses both the OpenAI API directly and browser automation (AppleScript) to send queries to ChatGPT/Claude/Grok web UIs.

## Build & Dev Commands

```bash
npm run dev          # ray develop — start Raycast dev mode (hot reload)
npm run build        # ray build -e dist
npm run lint         # ray lint (uses @raycast eslint config)
npm run fix-lint     # ray lint --fix
```

No test framework is configured. Verify changes via `npm run lint` and `npm run build`.

## Architecture

### Two Command Patterns

Every command exports a default function/component from `src/`. Commands are registered in `package.json` under `commands[]` with either `"mode": "view"` (shows UI) or `"mode": "no-view"` (background action).

**1. API-based commands (view mode)** — call OpenAI API with streaming, display result in a `Detail` view:
- Thin wrappers that call `ResultView(prompt, model_override, toast_title)` from `src/common.tsx`
- Examples: `summarize.tsx`, `rewrite.tsx`, `paraphrase.tsx`, `custom.tsx`, `preview.tsx`
- Pattern: read preference for prompt + model override, pass to `ResultView`

**2. Browser automation commands (no-view mode)** — use AppleScript to open Safari/Chrome, paste text into AI web UIs, and submit:
- Use utilities from `src/ai_platform_utils.ts` (clipboard, browser tab management, text area focus, paste+send)
- Examples: `bulletPoints.tsx`, `customSearch.tsx`, `codeExplainer.tsx`, `emailComposer.tsx`, `chatgpt_voice.tsx`, `screenshotAnalyzer.tsx`
- Support both Safari and Chrome via `Browser` enum, with tab reuse behavior

**3. Standalone commands** — direct OpenAI calls without `ResultView`:
- `execute.ts` — sends selected text, pastes response directly (no UI)
- `transform.tsx` — takes a user-provided prompt argument
- `setReminder.tsx`, `googleSearch.tsx`, `linkOpener.tsx` — macOS automation without AI

### Key Shared Modules

| File | Purpose |
|---|---|
| `src/api.ts` | OpenAI client init + global model export |
| `src/common.tsx` | `ResultView` — streaming API response component with retry, token counting, cost estimation, SideNote integration |
| `src/ai_platform_utils.ts` | Browser automation: open/reuse tabs, focus text areas, paste+send via AppleScript. Supports Safari & Chrome. |
| `src/util.ts` | Token counting (`@nem035/gpt-3-encoder`), price estimation, AppleScript helpers |

### Preferences System

- **Global preferences** (in root `preferences[]` of `package.json`): API key, default model, default browser, SideNote toggle
- **Per-command preferences** (in each command's `preferences[]`): custom prompt text, model override (defaults to `"global"` to follow the global model)
- Model dropdown lists are duplicated across every command's preferences in `package.json` — when adding a new model, update the global dropdown AND every command's `model_*` dropdown

### AI Platforms (Browser Automation)

Defined in `ai_platform_utils.ts`:
- ChatGPT: `chatgpt.com/?temporary-chat=true`, selector `textarea`
- Claude: `claude.ai/new`, selector `.ProseMirror`
- Grok: `grok.com/`, selector `.grok-chat-input`

### AppleScript Considerations

Browser automation relies on macOS AppleScript. Chrome requires "Allow JavaScript from Apple Events" (View > Developer). The code handles this permission error with `isChromeJSPermissionError()` and falls back to System Events keystroke automation.
